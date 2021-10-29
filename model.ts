export class GlobalProps {
  slideWidth?: number
  slideHeight?: number
  slidePaths?: any[]
  slideLayouts?: any[]
  thumbnail?: string
  theme?: any

  globalStyles: {[key: string]: CssStyle} = {}

  addStyle(name: string, val: CssStyle) {
    this.globalStyles[name] = val
  }
}

export class SingleSlide {
  content: any
  // slide的资源内容
  resContent: any
  // 布局文件的内容
  layoutContent: any
  // 布局文件的资源内容
  layoutResContent: any
  // 布局文件内容索引表
  layoutIndexTables?: { idTable: any, idxTable: any, typeTable: any }
  // 母版的内容
  masterContent: any
  // 母版的字体样式
  masterTextStyles?: string
  // 母版的索引表
  masterIndexTable?: { idTable: any, idxTable: any, typeTable: any }
  masterResContent?: any
  bgColor?: string
  gprops?: GlobalProps
}

export class CssStyle {

  content: {[key: string]: string} = {}

  constructor(private readonly name: string) {
    this.name = name
  }

  add(key: string, val: string) {
    this.content[key] = val
  }

  addWidth(val: number) {
    this.add("width", val + "px")
  }

  addHeight(val: number) {
    this.add("height", val + "px")
  }

  addBGBase64Img(val: string) {
    this.add("background-image", `url(data:image/png;base64,${val})`)
  }

  toString() {
    let s = ""
    for (const key in this.content) {
      s += `${key}: ${this.content[key]};`
    }

    return `.${this.name} {${s}}`
  }
}
