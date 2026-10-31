type Props = {
  html: string;
  className?: string;
  as?: 'div' | 'p';
};

/**
 * Renders rich text (a limited HTML subset) coming from our own static content.
 * Never pass user-provided input here.
 */
export default function RichText({ html, className, as: Tag = 'p' }: Props) {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: html is our own static copy from i18n JSON, never user input
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
