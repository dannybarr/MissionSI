import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/mission-studio')({
  beforeLoad: () => {
    throw redirect({ to: '/studio', replace: true })
  },
})
