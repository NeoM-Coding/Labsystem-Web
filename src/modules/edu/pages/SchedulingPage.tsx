import { SchedulingWorkspace } from '../components/SchedulingWorkspace'

export default function SchedulingPage() {
  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EDUCATION</p>
          <h1>实验室排课</h1>
        </div>
        <p>按学期、实验室与有效周维护课程安排</p>
      </div>
      <SchedulingWorkspace />
    </div>
  )
}
