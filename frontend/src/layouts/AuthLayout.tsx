import { Outlet } from 'react-router-dom';
import logoFull from "../assets/logo_full.jpg";


export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-solarized-base3 to-solarized-base2 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <img
                src={logoFull}
                alt="SignStudio"
                className="h-16 object-contain"
              />
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
