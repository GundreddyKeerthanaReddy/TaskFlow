import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Zap className="text-white" size={22} />
            </div>
            <span className="text-2xl font-bold text-white">TaskFlow</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Manage projects,<br />
            <span className="text-primary-300">ship faster.</span>
          </h1>
          <p className="text-primary-200 text-lg leading-relaxed max-w-md">
            The all-in-one platform for teams to plan, track, and collaborate on projects with clarity and speed.
          </p>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              'Drag-and-drop Kanban boards',
              'Real-time team collaboration',
              'Advanced analytics & reporting',
              'Smart task prioritization'
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-primary-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-primary-400 rounded-full" />
                </div>
                <span className="text-primary-100 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-primary-400 text-sm">
            Trusted by 10,000+ teams worldwide
          </p>
        </div>
      </div>

      {/* Right panel - auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white dark:bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white" size={18} />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">TaskFlow</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
