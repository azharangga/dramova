type PageHeaderProps = {
  kicker: string;
  kickerI18n: string;
  title: string;
  titleI18n: string;
  subtitle: string;
  subtitleI18n: string;
  className?: string;
  subtitleId?: string;
};

export default function PageHeader({
  kicker,
  kickerI18n,
  title,
  titleI18n,
  subtitle,
  subtitleI18n,
  className = "",
  subtitleId,
}: PageHeaderProps) {
  return (
    <div className={`page-header${className ? ` ${className}` : ""}`}>
      <p className="page-kicker" data-i18n={kickerI18n}>
        {kicker}
      </p>
      <h1 className="page-title" data-i18n={titleI18n}>
        {title}
      </h1>
      <p id={subtitleId} className="page-subtitle" data-i18n={subtitleI18n}>
        {subtitle}
      </p>
    </div>
  );
}
