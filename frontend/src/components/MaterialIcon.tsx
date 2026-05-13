/**
 * MaterialIcon – Renders a Material Symbols Outlined icon.
 * @example <MaterialIcon name="sports_soccer" className="text-primary" />
 * @example <MaterialIcon name="verified" filled size={16} />
 */
interface MaterialIconProps {
  name: string;
  className?: string;
  size?: number;
  filled?: boolean;
}

export function MaterialIcon({ name, className = '', size, filled }: MaterialIconProps) {
  const style: React.CSSProperties = {};
  if (size) style.fontSize = `${size}px`;
  if (filled) style.fontVariationSettings = "'FILL' 1";

  return (
    <span className={`material-symbols-outlined ${className}`} style={style}>
      {name}
    </span>
  );
}
