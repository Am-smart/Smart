import React from 'react';

export const AuthOverlay = () => {
  return (
    <div id="authOverlay" className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-4 hidden">
      {/* Signup */}
      <div id="signup" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl">
        <button className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
        <div id="maintBannerSignup" className="hidden bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-3 mb-4 text-center text-sm"></div>
        <h2 id="signup-title" className="text-2xl font-bold text-slate-900 mb-6">Sign Up</h2>
        <form id="signupForm" noValidate className="space-y-4">
          <input type="text" id="fullName" placeholder="Full Name" required className="input-custom" />
          <input type="email" id="email" placeholder="Email" required className="input-custom" />
          <input type="tel" id="phone" placeholder="Phone (optional)" className="input-custom" />
          <input type="password" id="password" placeholder="Password" required className="input-custom" />
          <input type="password" id="confirmPassword" placeholder="Confirm Password" required className="input-custom" />
          <input type="hidden" id="role" value="student" />
          <button type="submit" className="btn-primary w-full py-3">Create Account</button>
          <p className="text-center text-sm text-slate-600">Already have an account? <a href="#" className="text-primary font-semibold hover:underline">Sign in</a></p>
        </form>
        <p className="text-red-500 text-sm mt-4 text-center" id="signupError"></p>
      </div>

      {/* Login */}
      <div id="login" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl hidden">
        <button className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
        <div id="maintBannerLogin" className="hidden bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-3 mb-4 text-center text-sm"></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Login</h2>
        <form id="loginForm" noValidate className="space-y-4">
          <input type="email" id="loginEmail" placeholder="Email" required className="input-custom" />
          <p className="text-red-500 text-xs" id="loginEmailError"></p>
          <input type="password" id="loginPassword" placeholder="Password" required className="input-custom" />
          <p className="text-red-500 text-xs" id="loginPasswordError"></p>
          <button type="submit" className="btn-primary w-full py-3">Login</button>
        </form>
        <p className="text-center text-sm text-slate-600 mt-6"><a href="#" className="text-primary hover:underline">Forgot Password?</a></p>
        <p className="text-center text-sm text-slate-600 mt-2">No account? <a href="#" className="text-primary font-semibold hover:underline">Create one</a></p>
      </div>

      {/* Reset Request */}
      <div id="reset" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl hidden">
        <button className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
        <div id="maintBannerReset" className="hidden bg-amber-50 text-amber-700 border border-amber-100 rounded-lg p-3 mb-4 text-center text-sm"></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Reset Password</h2>
        <form id="resetForm" noValidate className="space-y-4">
          <input type="email" id="resetEmail" placeholder="Enter your email" required className="input-custom" />
          <button type="submit" className="btn-primary w-full py-3">Request Reset</button>
        </form>
        <p className="text-center text-sm text-slate-600 mt-6"><a href="#" className="text-primary hover:underline">Back to login</a></p>
        <p className="text-red-500 text-sm mt-4 text-center" id="resetError"></p>
      </div>

      {/* Set New Password (after temp login) */}
      <div id="newPassword" className="bg-white w-full max-w-md rounded-2xl p-8 relative shadow-2xl hidden">
        <button className="absolute top-4 right-4 text-2xl text-slate-400 hover:text-slate-600 transition-colors">×</button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Set New Password</h2>
        <form id="newPasswordForm" noValidate className="space-y-4">
          <input type="password" id="newPass" placeholder="New Password" required className="input-custom" />
          <input type="password" id="confirmNewPass" placeholder="Confirm New Password" required className="input-custom" />
          <button type="submit" className="btn-primary w-full py-3">Update Password</button>
        </form>
        <p className="text-red-500 text-sm mt-4 text-center" id="newPasswordError"></p>
      </div>
    </div>
  );
};
