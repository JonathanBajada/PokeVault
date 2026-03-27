'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function SignupPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError('');

		try {
			const res = await fetch(`${API_URL}/users/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, username, password }),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setError(data.error ?? `Registration failed (HTTP ${res.status})`);
				return;
			}

			// Auto sign-in after successful registration
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false,
			});

			if (result?.error) {
				router.push('/login');
			} else {
				router.push('/');
			}
		} catch {
			setError('Could not reach the server. Is it running?');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16'>
			<div className='max-w-md w-full'>
				{/* Header */}
				<div className='text-center mb-8'>
					<Link
						href='/'
						className='inline-flex items-center gap-2 text-2xl md:text-3xl font-brand hover:opacity-80 transition-opacity mb-4'
						style={{
							color: 'var(--text-primary)',
							fontWeight: 600,
							letterSpacing: '0.5px',
						}}
					>
						Poke Vault
					</Link>
					<h1
						className='font-brand text-3xl md:text-4xl font-bold mb-2'
						style={{ color: 'var(--text-primary)' }}
					>
						Create Account
					</h1>
					<p className='font-body text-sm' style={{ color: 'var(--text-muted)' }}>
						Start building your collection
					</p>
				</div>

				{/* Form */}
				<div
					className='rounded-2xl p-8'
					style={{
						background: 'var(--bg-elevated)',
						border: '1px solid var(--border-default)',
						boxShadow: 'var(--shadow-md)',
					}}
				>
					<form onSubmit={handleSubmit} className='space-y-5'>
						{error && (
							<div
								className='flex items-start gap-3 px-4 py-3 rounded-xl text-sm'
								style={{
									background: 'rgba(239, 68, 68, 0.12)',
									border: '1px solid rgba(239, 68, 68, 0.4)',
									color: '#fca5a5',
								}}
							>
								<svg className='w-4 h-4 mt-0.5 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
									<path strokeLinecap='round' strokeLinejoin='round' d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' />
								</svg>
								<span>{error}</span>
							</div>
						)}

						{/* Email */}
						<div>
							<label
								htmlFor='email'
								className='block text-sm font-medium mb-2'
								style={{ color: 'var(--text-secondary)' }}
							>
								Email
							</label>
							<input
								id='email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className='w-full px-4 py-3 rounded-xl transition-all duration-200'
								style={{
									background: 'rgba(255, 255, 255, 0.05)',
									border: '1px solid var(--border-default)',
									color: 'var(--text-primary)',
								}}
								onFocus={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.08)';
									e.target.style.borderColor = 'var(--border-gold)';
									e.target.style.boxShadow = '0 0 0 2px var(--vault-gold-faint)';
								}}
								onBlur={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.05)';
									e.target.style.borderColor = 'var(--border-default)';
									e.target.style.boxShadow = 'none';
								}}
								placeholder='you@example.com'
							/>
						</div>

						{/* Username */}
						<div>
							<label
								htmlFor='username'
								className='block text-sm font-medium mb-2'
								style={{ color: 'var(--text-secondary)' }}
							>
								Username
							</label>
							<input
								id='username'
								type='text'
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								className='w-full px-4 py-3 rounded-xl transition-all duration-200'
								style={{
									background: 'rgba(255, 255, 255, 0.05)',
									border: '1px solid var(--border-default)',
									color: 'var(--text-primary)',
								}}
								onFocus={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.08)';
									e.target.style.borderColor = 'var(--border-gold)';
									e.target.style.boxShadow = '0 0 0 2px var(--vault-gold-faint)';
								}}
								onBlur={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.05)';
									e.target.style.borderColor = 'var(--border-default)';
									e.target.style.boxShadow = 'none';
								}}
								placeholder='TrainerRed'
							/>
						</div>

						{/* Password */}
						<div>
							<label
								htmlFor='password'
								className='block text-sm font-medium mb-2'
								style={{ color: 'var(--text-secondary)' }}
							>
								Password
							</label>
							<input
								id='password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								className='w-full px-4 py-3 rounded-xl transition-all duration-200'
								style={{
									background: 'rgba(255, 255, 255, 0.05)',
									border: `1px solid ${password.length > 0 && password.length < 8 ? 'rgba(239,68,68,0.6)' : 'var(--border-default)'}`,
									color: 'var(--text-primary)',
								}}
								onFocus={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.08)';
									e.target.style.borderColor = 'var(--border-gold)';
									e.target.style.boxShadow = '0 0 0 2px var(--vault-gold-faint)';
								}}
								onBlur={(e) => {
									e.target.style.background = 'rgba(255, 255, 255, 0.05)';
									e.target.style.borderColor = password.length > 0 && password.length < 8
										? 'rgba(239,68,68,0.6)'
										: 'var(--border-default)';
									e.target.style.boxShadow = 'none';
								}}
								placeholder='At least 8 characters'
							/>
							{password.length > 0 && password.length < 8 && (
								<p className='mt-1.5 text-xs' style={{ color: '#fca5a5' }}>
									Password must be at least 8 characters ({8 - password.length} more needed)
								</p>
							)}
						</div>

						{/* Submit */}
						<button
							type='submit'
							disabled={isLoading || password.length < 8}
							className='w-full py-3 rounded-xl font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
							style={{
								background: isLoading
									? 'var(--vault-gold-soft)'
									: 'linear-gradient(135deg, var(--vault-gold), var(--vault-gold-dark))',
								color: 'var(--text-inverse)',
								border: 'none',
								boxShadow: isLoading ? 'none' : '0 10px 22px rgba(199, 179, 119, 0.35)',
							}}
						>
							{isLoading ? 'Creating account...' : 'Create Account'}
						</button>
					</form>

					<div className='text-center mt-6'>
						<p className='text-sm' style={{ color: 'var(--text-muted)' }}>
							Already have an account?{' '}
							<Link
								href='/login'
								className='font-semibold transition-colors duration-200 hover:opacity-80'
								style={{ color: 'var(--vault-gold)' }}
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
