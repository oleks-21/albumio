import { render, screen, fireEvent, act } from '@testing-library/react';
import useImageStatus from './useImageStatus';

function Thumb({ src }) {
  const img = useImageStatus(src);
  return (
    <div>
      <span data-testid="status">{img.status}</span>
      {img.status !== 'error' && (
        <img key={img.key} ref={img.ref} src={img.src} alt="" onLoad={img.onLoad} onError={img.onError} />
      )}
    </div>
  );
}

describe('useImageStatus', () => {
  test('marks an image loaded when its load event fires', () => {
    render(<Thumb src="https://img.test/a.jpg" />);
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    fireEvent.load(document.querySelector('img'));
    expect(screen.getByTestId('status')).toHaveTextContent('loaded');
  });

  test('recognises an image that finished loading before React could observe it', () => {
    // A cached image (e.g. preloaded by the slideshow) is already complete when
    // it mounts. The slideshow used to reset these to 'loading' and show black.
    const complete = jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    const width = jest.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800);
    render(<Thumb src="https://img.test/cached.jpg" />);
    expect(screen.getByTestId('status')).toHaveTextContent('loaded');
    complete.mockRestore();
    width.mockRestore();
  });

  test('a load event is not undone when the next source arrives', () => {
    const { rerender } = render(<Thumb src="https://img.test/1.jpg" />);
    fireEvent.load(document.querySelector('img'));
    rerender(<Thumb src="https://img.test/2.jpg" />);
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    fireEvent.load(document.querySelector('img'));
    expect(screen.getByTestId('status')).toHaveTextContent('loaded');
  });

  test('a load that never finishes becomes an error with retry', () => {
    jest.useFakeTimers();
    render(<Thumb src="https://img.test/slow.jpg" />);
    act(() => { jest.advanceTimersByTime(20001); });
    expect(screen.getByTestId('status')).toHaveTextContent('error');
    jest.useRealTimers();
  });
});

describe('useImageStatus with an identity', () => {
  function Signed({ src, id }) {
    const img = useImageStatus(src, { identity: id, bust: false });
    return (
      <div>
        <span data-testid="status">{img.status}</span>
        {img.status !== 'error' && (
          <img key={img.key} src={img.src} alt="" data-testid="img" onLoad={img.onLoad} onError={img.onError} />
        )}
        <button type="button" onClick={img.retry}>retry</button>
      </div>
    );
  }

  test('a loaded image keeps its URL when a refreshed URL for the same photo arrives', () => {
    const { rerender } = render(<Signed src="https://img.test/a?sig=1" id="p1" />);
    fireEvent.load(screen.getByTestId('img'));
    rerender(<Signed src="https://img.test/a?sig=2" id="p1" />);
    expect(screen.getByTestId('status')).toHaveTextContent('loaded');
    expect(screen.getByTestId('img')).toHaveAttribute('src', 'https://img.test/a?sig=1');
  });

  test('a failed image switches to the refreshed URL, and retries never edit a signed URL', () => {
    const { rerender } = render(<Signed src="https://img.test/a?sig=1" id="p1" />);
    fireEvent.error(screen.getByTestId('img'));
    expect(screen.getByTestId('status')).toHaveTextContent('error');
    fireEvent.click(screen.getByText('retry'));
    expect(screen.getByTestId('img')).toHaveAttribute('src', 'https://img.test/a?sig=1');
    fireEvent.error(screen.getByTestId('img'));
    rerender(<Signed src="https://img.test/a?sig=2" id="p1" />);
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    expect(screen.getByTestId('img')).toHaveAttribute('src', 'https://img.test/a?sig=2');
  });
});
