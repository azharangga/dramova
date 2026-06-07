import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  titleI18n: string;
  subtitle: string;
  subtitleI18n: string;
  action?: ReactNode;
};

export default function SectionHeader({
  title,
  titleI18n,
  subtitle,
  subtitleI18n,
  action,
}: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title" data-i18n={titleI18n}>
          {title}
        </h2>
        <p className="section-subtitle" data-i18n={subtitleI18n}>
          {subtitle}
        </p>
      </div>
      {action}
    </div>
  );
}
