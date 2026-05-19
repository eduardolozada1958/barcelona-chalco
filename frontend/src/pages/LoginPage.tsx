import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { useAuth } from '@/contexts/AuthContext';
import { MaterialIcon } from '@/components/MaterialIcon';
import { CLUB_LOGO_URL } from '@/config/club';
import { getApiErrorMessage } from '@utils/api-error';

const schema = z.object({
  email:    z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type Form = z.infer<typeof schema>;

/**
 * Login Page – faithful translation of `iniciarsesion.html` mockup.
 * Features: background glow, two selector cards (Parent / Coach-Admin), login form.
 */
export function LoginPage() {
  const { login, completeLoginWithTotp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const [selectedRole, setSelectedRole] = useState<'parent' | 'admin' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [totpStep, setTotpStep] = useState(false);
  const [pendingToken, setPendingToken] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpSubmitting, setTotpSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      const result = await login(data.email, data.password);
      if (result.requiresTotp) {
        setPendingToken(result.pendingToken);
        setTotpStep(true);
        setTotpCode('');
        toast.success('Ingresa el código de tu autenticador');
        return;
      }
      toast.success('Sesión iniciada');
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(getApiErrorMessage(e));
    }
  };

  const onTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.replace(/\s/g, '').length < 6) return;
    setTotpSubmitting(true);
    try {
      await completeLoginWithTotp(pendingToken, totpCode);
      toast.success('Sesión iniciada');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setTotpSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-margin-mobile md:px-margin-desktop py-stack-lg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none flex justify-center items-center opacity-20">
        <div className="w-[800px] h-[800px] bg-primary rounded-full blur-[150px] mix-blend-screen" />
      </div>

      <main className="z-10 w-full max-w-4xl flex flex-col items-center gap-stack-lg">
        {/* Header */}
        <header className="text-center flex flex-col items-center gap-stack-sm">
          <img src={CLUB_LOGO_URL} alt="F.C. Barcelona Cupido" className="w-24 h-24 object-contain drop-shadow-2xl" />
          <h1 className="font-display-hero text-headline-lg-mobile md:text-display-hero text-primary tracking-tighter">
            F.C. BARCELONA CUPIDO
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
            Rendimiento Élite &amp; Identidad Digital. Selecciona tu tipo de cuenta para continuar.
          </p>
        </header>

        {/* Selector Cards (shown when form is hidden) */}
        {!selectedRole ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full">
            {/* Parent Card */}
            <button
              type="button"
              onClick={() => setSelectedRole('parent')}
              className="group relative bg-[#002366]/40 backdrop-blur-md rounded-xl border border-primary/20 hover:border-primary/50 transition-all duration-300 p-stack-md flex flex-col items-center text-center overflow-hidden hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#002366]/60 z-0" />
              <div className="z-10 flex flex-col items-center gap-stack-sm w-full">
                <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-base border border-outline-variant/30 group-hover:scale-110 transition-transform duration-300">
                  <MaterialIcon name="family_restroom" className="text-primary text-4xl" filled />
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Entrar como Padre</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Accede al perfil de tu jugador, revisa estadísticas y calendario.
                </p>
                <div className="mt-base bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant/30 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-300">
                  <span className="font-label-caps text-label-caps">Acceder</span>
                </div>
              </div>
            </button>

            {/* Admin Card */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className="group relative bg-[#002366]/40 backdrop-blur-md rounded-xl border border-primary/20 hover:border-primary/50 transition-all duration-300 p-stack-md flex flex-col items-center text-center overflow-hidden hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#002366]/60 z-0" />
              <div className="z-10 flex flex-col items-center gap-stack-sm w-full">
                <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center mb-base border border-outline-variant/30 group-hover:scale-110 transition-transform duration-300">
                  <MaterialIcon name="admin_panel_settings" className="text-primary text-4xl" filled />
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">Entrar como Admin</h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Gestión de equipos, control de asistencia, reportes tácticos y configuración.
                </p>
                <div className="mt-base bg-surface-container-lowest px-4 py-2 rounded-full border border-outline-variant/30 group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors duration-300">
                  <span className="font-label-caps text-label-caps">Acceder</span>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* Login Form */
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => setSelectedRole(null)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-6 font-label-caps text-label-caps"
            >
              <MaterialIcon name="arrow_back" size={18} /> Cambiar tipo de cuenta
            </button>

            <div className="bg-[#002366]/40 backdrop-blur-md rounded-xl border border-primary/20 p-stack-lg relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-4 mb-stack-md relative z-10">
                <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center border border-primary/30">
                  <MaterialIcon
                    name={selectedRole === 'parent' ? 'family_restroom' : 'admin_panel_settings'}
                    className="text-primary"
                    filled
                  />
                </div>
                <div>
                  <h2 className="font-headline-lg text-headline-lg-mobile text-on-surface">
                    {selectedRole === 'parent' ? 'Acceso Padre / Tutor' : 'Acceso Admin'}
                  </h2>
                  <p className="font-label-caps text-label-caps text-on-surface-variant">Ingresa tus credenciales</p>
                </div>
              </div>

              {totpStep ? (
                <form onSubmit={onTotpSubmit} className="space-y-6 relative z-10">
                  <p className="text-sm text-on-surface-variant">
                    Abre Google Authenticator e ingresa el código de 6 dígitos (o un código de respaldo).
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="000000"
                    maxLength={12}
                    value={totpCode}
                    onChange={(ev) => setTotpCode(ev.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 text-center text-xl tracking-widest text-on-surface outline-none"
                  />
                  <button
                    type="submit"
                    disabled={totpSubmitting || totpCode.replace(/\s/g, '').length < 6}
                    className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-lg disabled:opacity-60"
                  >
                    Verificar código
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTotpStep(false);
                      setPendingToken('');
                      setTotpCode('');
                    }}
                    className="w-full text-sm text-on-surface-variant hover:text-primary"
                  >
                    Volver al inicio de sesión
                  </button>
                </form>
              ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                <div>
                  <label htmlFor="email" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    CORREO ELECTRÓNICO
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 text-on-surface font-body-md outline-none transition-colors placeholder:text-on-surface-variant/40"
                    {...register('email')}
                  />
                  {errors.email ? <p className="mt-2 text-sm text-error">{errors.email.message}</p> : null}
                </div>

                <div>
                  <label htmlFor="password" className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    CONTRASEÑA
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary rounded-lg px-4 py-3 pr-12 text-on-surface font-body-md outline-none transition-colors placeholder:text-on-surface-variant/40"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <MaterialIcon name={showPassword ? 'visibility_off' : 'visibility'} size={22} />
                    </button>
                  </div>
                  {errors.password ? <p className="mt-2 text-sm text-error">{errors.password.message}</p> : null}
                </div>
                <p className="text-right -mt-2">
                  <Link to="/olvide-contraseña" className="text-sm text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-on-primary font-label-caps text-label-caps py-4 rounded-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <MaterialIcon name="progress_activity" className="animate-spin" size={18} />
                  ) : (
                    <MaterialIcon name="login" size={18} />
                  )}
                  Iniciar Sesión
                </button>
              </form>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-on-surface-variant space-y-2">
              <span className="block">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Regístrate como padre
                </Link>
              </span>
              {selectedRole === 'parent' ? (
                <span className="block">
                  ¿No llegó el correo de confirmación?{' '}
                  <Link to="/verificar-email" className="font-medium text-primary hover:underline">
                    Reenviar enlace
                  </Link>
                </span>
              ) : null}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}


