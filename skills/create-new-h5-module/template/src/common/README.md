#### setReport 埋点

如果活动是小程序组提出的，数数埋点账号修改为小程序对应的：

正式地址appid为：9c5ef5a5c97044b69053910efa75f462
测试地址appid为：4135588af6af4645a222978cdaeda0cf
ola.ts中配置：
```javascript
  import Ola, {  who } from '@ola/app'
  who.thinkingdata.appid = import.meta.env.PROD
    ? '9c5ef5a5c97044b69053910efa75f462'
    : '4135588af6af4645a222978cdaeda0cf'
  who.packages = ['im.who-tarot.h5']
```
需要埋点的页面中调用：
```javascript
  import { checkWebpFeature } from '@ola/utils'

  // 进入页面时候默认通用埋点：检测webp支持情况
  checkWebpFeature().then((res) => {
    window.ta.track('h5_webp', {
      support: res ? 1 : 0
    })
  })
  // 进入页面时候默认通用埋点：
  // from：weChat ｜ moment ｜ qrCode ｜ share
  useEffect(() => {
    const from = getQueryValue('from') || ''
    const shareUid = getQueryValue('shareUid') || ''
    const curUid =
      Number(ola?.user?.uid || '0') > 0
        ? ola?.user?.uid
        : window.thinkingdata?.getDistinctId()

    if (String(curUid) === String(shareUid)) return
    if (from) {
      window.ta.track('h5_enter_share', {
        share_uid: shareUid,
        from
      })
    }
  }, [])


 
```