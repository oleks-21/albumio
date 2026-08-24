import Typography from '@mui/material/Typography';
import { gradients } from '../../theme';

/*
 * Animated gray<->indigo gradient heading, clipped to the text — the
 * reference template's signature h1/h2 treatment.
 */
export default function GradientHeading({
  children,
  variant = 'h2',
  component,
  sx = {},
  ...rest
}) {
  return (
    <Typography
      variant={variant}
      component={component}
      sx={{
        display: 'inline-block',
        backgroundImage: gradients.heading,
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        animation: 'albumio-gradient 6s linear infinite',
        '@keyframes albumio-gradient': {
          to: { backgroundPosition: '200% center' },
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Typography>
  );
}
