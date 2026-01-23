import { Outlet } from 'react-router';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 70px)' }}>
        <Outlet />
      </main>
    </>
  );
}