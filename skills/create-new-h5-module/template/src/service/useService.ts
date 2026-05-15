import { useCallback, useEffect, useState } from 'react'

export default function useService<Res>(fetcher: () => Promise<Res>) {
  const [error, setError] = useState<Error>()
  const [res, setRes] = useState<Res>()

  const fetch = useCallback(() => {
    setRes(undefined)
    setError(undefined)
    fetcher().then(setRes).catch(setError)
  }, [fetcher])

  useEffect(() => fetch(), [fetch])

  return { error, res, fetch }
}
