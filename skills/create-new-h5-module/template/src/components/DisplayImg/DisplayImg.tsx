/*eslint-disable*/
import { CSSProperties, FC, useEffect, useState } from 'react'
import './DisplayImg.scoped.css'

/**
  Some low-end device does not support webp, provide a default png assets as a fallback
 **/

interface Iprops {
  iconStatic?: string
  iconDynamic?: string
  classes?: string
  style?: CSSProperties
}

const DisplayImg: FC<Iprops> = ({
  iconStatic,
  iconDynamic,
  classes = '',
  style
}) => {
  const [isSupportWebP, setIsSupportWebP] = useState<boolean>(false)

  const img = new Image()

  function checkWebpFeature(imageUrl: string) {
    img.onload = function () {
      let result = img.width > 0 && img.height > 0
      setIsSupportWebP(result)
    }
    img.onerror = function () {
      setIsSupportWebP(false)
    }
    img.src = imageUrl
  }

  useEffect(() => {
    checkWebpFeature(iconDynamic ?? '')
    return () => {
      if (img) {
        img.onload = null
        img.onerror = null
      }
    }
  }, [])

  return isSupportWebP ? (
    <img className={classes} style={style ?? {}} src={iconDynamic} alt="icon" />
  ) : (
    <img
      className={classes}
      style={style ?? {}}
      src={iconStatic ?? iconDynamic}
      alt="icon"
    />
  )
}

export default DisplayImg
