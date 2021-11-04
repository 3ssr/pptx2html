import SlideProcessor from './slideproc'
import PPTXProvider from './provider'
import { computePixel, img2Base64 } from './util'
import { GlobalProps, SlideView, ThemeContent } from './model'
import { exit } from 'process'

export default class PPTXConverter {
  srcFilePath: string
  gprops: GlobalProps
  provider: PPTXProvider

  constructor(srcFilePath: string) {
    this.srcFilePath = srcFilePath
    this.gprops = new GlobalProps()
    this.provider = new PPTXProvider(this.srcFilePath)
  }

  async convert(page: string) {
    await this.provider.init()
    let [slideWidth, slideHeight] = await this.loadSlideSize()
    let [slidePaths, slideLayouts] = await this.loadSlidesAndLayouts()

    this.gprops.slideWidth = slideWidth
    this.gprops.slideHeight = slideHeight
    this.gprops.thumbnail = await this.loadThumbImg()

    this.gprops.slidePaths = slidePaths
    this.gprops.slideLayouts = slideLayouts
    this.gprops.theme = new ThemeContent(await this.loadTheme())

    return await this.processSlides(page)
  }

  async loadThumbImg() {
    return img2Base64(await this.provider.loadArrayBuffer("docProps/thumbnail.jpeg"))
  }

  // 读取[Content_Types].xml，解析出slides和slideLayouts
  async loadSlidesAndLayouts() {
    let contentTypes = await this.provider.loadXML("[Content_Types].xml")
    let subObj = contentTypes["Types"]["Override"]
    let slidesLocArray = []
    let slideLayoutsLocArray = []

    for (let i = 0; i < subObj.length; i++) {
      switch (subObj[i]["attrs"]["ContentType"]) {
        case "application/vnd.openxmlformats-officedocument.presentationml.slide+xml":
          slidesLocArray.push(subObj[i]["attrs"]["PartName"].substr(1))
          break
        case "application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml":
          slideLayoutsLocArray.push(subObj[i]["attrs"]["PartName"].substr(1))
          break
        default:
          break
      }
    }

    return [slidesLocArray, slideLayoutsLocArray]
  }

  // 获取幻灯片宽高
  async loadSlideSize() {
    let content = await this.provider.loadXML("ppt/presentation.xml")
    let sldSzAttrs = content["p:presentation"]["p:sldSz"]["attrs"]
    let slideWidth = computePixel(sldSzAttrs["cx"])
    let slideHeight = computePixel(sldSzAttrs["cy"])

    return [slideWidth, slideHeight]
  }

  async loadTheme() {
    let prenContent = await this.provider.loadXML("ppt/_rels/presentation.xml.rels")
    let relationships = prenContent["Relationships"]["Relationship"]
    let themeURI = undefined;

    if (relationships.constructor === Array) {
      for (let i = 0; i < relationships.length; i++) {
        if (relationships[i]["attrs"]["Type"] === "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme") {
          themeURI = relationships[i]["attrs"]["Target"];
          break;
        }
      }
    } else if (relationships["attrs"]["Type"] === "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme") {
      themeURI = relationships["attrs"]["Target"];
    }

    if (themeURI === undefined) {
      throw Error("Can't open theme file.");
    }

    return await this.provider.loadXML("ppt/" + themeURI)
  }

  async processSlides(page: string) {
    let svs: SlideView[] = []

    if (page) {
      let pageNum = parseInt(page)
      let slide = this.gprops.slidePaths![pageNum]
      if (!slide) {
        console.log("invalid page")
        exit()
      }

      let processor = new SlideProcessor(slide, this.provider!, this.gprops!)
      svs.push(await processor.process())
      return svs
    }

    for (const slide of this.gprops?.slidePaths!) {
      let processor = new SlideProcessor(slide, this.provider!, this.gprops!)
      svs.push(await processor.process())
    }

    return svs
  }
}
