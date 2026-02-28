import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

const GlobalWebVitalsInfo = {
  // 请求发起到收到第一个字节，反映服务端 / 网络速度
  TTFB: "0",
  // 首次绘制-页面第一次有像素渲染到屏幕
  FP: "0",
  // 首次内容绘制-第一个文本 / 图片渲染，用户感知 “页面开始出来了”
  FCP: "0",
  // 最大内容绘制-页面最重要内容渲染完成，核心体验指标
  LCP:"0",
  // 首次输入延迟-用户第一次交互到浏览器响应的延迟（卡顿感）
  FID:"0",
  // 累计布局偏移-页面是否抖动、图片未留坑、广告挤位置
  CLS:"0",
}
function formatNumber(value) {
  return parseFloat(value.toFixed(2)).toString();
}
function reportWebVitals(metric) {
  // console.log("web-vitals", metric)
  if (metric.name == "TTFB" && metric.value) {
    GlobalWebVitalsInfo.TTFB = formatNumber(metric.value)
  }
  if (metric.name == "FCP" && metric.value) {
    GlobalWebVitalsInfo.FCP = formatNumber(metric.value)
  }
  if (metric.name == "LCP" && metric.value) {
    GlobalWebVitalsInfo.LCP = formatNumber(metric.value)
  }
  if (metric.name == "FID" && metric.value) {
    GlobalWebVitalsInfo.FID = formatNumber(metric.value)
  }
  if (metric.name == "CLS" && metric.value) {
    GlobalWebVitalsInfo.CLS = formatNumber(metric.value)
  }
}
 /**
  * @name 启动指标监听
  */
 // 累积布局偏移
 getCLS(reportWebVitals)
  // 首次输入延迟
 getFID(reportWebVitals)
 // 首次内容绘制
 getFCP(reportWebVitals)
  // 最大内容绘制（重点）
 getLCP(reportWebVitals)
  // 首字节时间
 getTTFB(reportWebVitals)

 export const getWebVitalsInfo =() =>{
  try {
    const v = performance.getEntriesByName('first-paint')?.[0]?.startTime || 0
    GlobalWebVitalsInfo.FP = formatNumber(v)
  } catch (error) {}

  if (GlobalWebVitalsInfo.FCP == "0") {
    try {
      const v = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      GlobalWebVitalsInfo.FCP = formatNumber(v)
    } catch (error) {}
  }
  return GlobalWebVitalsInfo
 }
