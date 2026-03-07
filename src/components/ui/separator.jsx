import { cn } from '../../lib/utils'
const Separator = ({ className, ...props }) => (
  <div className={cn('shrink-0 bg-border h-px w-full', className)} {...props} />
)
export { Separator }
