import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="centered-page">
      <section className="login-card"><p className="eyebrow">404</p><h1>页面不存在</h1><Link className="primary-button" to="/">返回首页</Link></section>
    </div>
  )
}
