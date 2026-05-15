import { useEffect, useState } from 'react'
import { getQuery } from '@ola/utils'
import ola from '/src/ola'

const useAppLocale = () => {
  const [lan, setLan] = useState('zh_cn')
  useEffect(() => {
    const Lan = getQuery('lan')
    const language = Lan || ola.user.lan
    setLan(language)
  }, [])
  return { lan, setLan }
}

export default useAppLocale
