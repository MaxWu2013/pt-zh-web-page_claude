/* eslint-disable */
import { useEffect, useState } from 'react'
import { useGlobal } from '@src/global.store'

export default function useLocale() {
  let [{ lan }] = useGlobal()
  let [locale, setLocale] = useState({})
  let language = lan.toLowerCase().split('-').join('_')
  useEffect(() => {
    import(`./${language}.json`).then(setLocale)
  }, [language])

  return { locale, language }
}
