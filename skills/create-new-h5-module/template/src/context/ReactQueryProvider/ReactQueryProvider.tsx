import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import React from 'react'
import { ChildrenProps } from '../types'

function ReactQueryProvider({ children }: ChildrenProps) {
  // https://react-query.tanstack.com/reference/QueryClient
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            retry: 1,
            retryDelay: 1 * 60 * 1000, // retry in a minute if api failed
            onSettled: (data) => {
              const needConsole = window.location.href.includes('console')
              const isLocal = window.location.href.includes('localhost')
              const isDevelopment = import.meta.env.DEV
              const isDevPage = window.location.href.includes('dev-page')
              if (data || needConsole || isLocal || isDevelopment || isDevPage)
                console.log(data)
            }
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default ReactQueryProvider
