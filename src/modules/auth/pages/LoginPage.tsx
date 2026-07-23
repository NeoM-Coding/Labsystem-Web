import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSession } from '../api/sessions'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const setSession = useAuthStore((state) => state.setSession)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const session = await createSession(username, password)
      setSession(session.tokenValue, session.user)
      navigate('/devices', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="centered-page">
      <section className="login-card">
        <p className="eyebrow">LAB SYSTEM</p>
        <h1>欢迎登录</h1>
        <p className="muted">登录后进入实验室设备数据中心。</p>
        <form onSubmit={login} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            用户名
            <input
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="h-12 rounded-xl border border-[#d8e3de] bg-[#f8faf9] px-4 outline-none transition-[border-color,box-shadow] focus:border-[#4ba786] focus:shadow-[0_0_0_3px_rgb(75_167_134_/_13%)]"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            密码
            <input
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 rounded-xl border border-[#d8e3de] bg-[#f8faf9] px-4 outline-none transition-[border-color,box-shadow] focus:border-[#4ba786] focus:shadow-[0_0_0_3px_rgb(75_167_134_/_13%)]"
            />
          </label>
          {error && <p role="alert" className="m-0 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 h-12 rounded-xl bg-[#147a56] font-bold text-white transition-[background-color,transform] hover:bg-[#116747] active:scale-[.97] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? '正在登录…' : '登录'}
          </button>
        </form>
      </section>
    </div>
  )
}
