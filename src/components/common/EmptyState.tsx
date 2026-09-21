type EmptyStateProps = {
  title: string
  description: string
  icon?: string
}

export function EmptyState({ title, description, icon = 'bi-inboxes' }: EmptyStateProps) {
  return (
    <div className="text-center py-5 px-3">
      <i className={`bi ${icon} fs-1 text-secondary`} aria-hidden="true" />
      <p className="h5 mt-3 mb-2">{title}</p>
      <p className="text-secondary mb-0">{description}</p>
    </div>
  )
}
