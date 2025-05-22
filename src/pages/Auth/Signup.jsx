import React, { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import { FaCheck, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import bcrypt from 'bcryptjs'

export default function Signup() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'User', // default role
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    match: false,
  })
  const [loading, setLoading] = useState(false)

  // Validate password on change
  useEffect(() => {
    const { password, confirmPassword } = form
    setPasswordRules({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password !== '' && password === confirmPassword,
    })
  }, [form])

  const handleChange = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const PolicyItem = ({ ok, text }) => (
    <div className={`flex items-center space-x-2 text-sm ${ok ? 'text-green-400' : 'text-gray-400'}`}>
      {ok ? <FaCheck /> : <FaTimes />} <span>{text}</span>
    </div>
  )

  const handleSubmit = async e => {
    e.preventDefault()
    const email = form.email.trim()
    // simple email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Please enter a valid email.')
      return
    }
    // all rules must be met
    if (!Object.values(passwordRules).every(Boolean)) {
      alert('Please meet all password requirements and confirm your password.')
      return
    }

    setLoading(true)
    try {
      // Hash password using bcryptjs
      const hashedPassword = bcrypt.hashSync(form.password, 10)

      const { error } = await supabase
        .from('user_credentials')
        .insert([{ email, password: hashedPassword, role: form.role }])
      if (error) throw error

      alert('Signup successful! You can now log in.')
      setForm({ email: '', password: '', confirmPassword: '', role: 'user' })
    } catch (err) {
      console.error(err)
      alert('Signup failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex items-center justify-center px-4">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(147,51,234,0.1),transparent_40%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.1),transparent_40%)]" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative z-10 max-w-md w-full space-y-6 bg-gray-800/60 p-8 rounded-xl shadow-xl"
      >
        <h2 className="text-center text-3xl font-extrabold">Sign Up</h2>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email address</label>
          <input
            id="email" name="email" type="email" required
            value={form.email} onChange={handleChange}
            className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
            placeholder="you@example.com"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
          <select
            id="role" name="role"
            value={form.role}
            onChange={handleChange}
            className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
          <div className="relative">
            <input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              required value={form.password}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">Confirm Password</label>
          <div className="relative">
            <input
              id="confirmPassword" name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400"
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Password Requirements */}
        <div className="space-y-1 text-sm px-2">
          <PolicyItem ok={passwordRules.length} text="At least 8 characters" />
          <PolicyItem ok={passwordRules.upper}  text="One uppercase letter" />
          <PolicyItem ok={passwordRules.lower}  text="One lowercase letter" />
          <PolicyItem ok={passwordRules.number} text="One number" />
          <PolicyItem ok={passwordRules.special} text="One special character (!@#$%^&*)" />
          <PolicyItem ok={passwordRules.match}   text="Passwords match" />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-medium ${
            loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Signing Up…' : 'Sign Up'}
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/signin" className="text-purple-400 hover:underline">Log in</Link>
        </p>
      </form>
    </div>
  )
}
