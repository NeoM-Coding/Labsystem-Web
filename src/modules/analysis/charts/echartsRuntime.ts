import { init, use as registerCharts } from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { AriaComponent, DataZoomComponent, GraphicComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

registerCharts([BarChart, LineChart, PieChart, AriaComponent, DataZoomComponent, GraphicComponent, GridComponent, LegendComponent, TooltipComponent, SVGRenderer])

export { init }
