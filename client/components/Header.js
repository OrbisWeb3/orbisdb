import Link from 'next/link';
import { useRouter } from 'next/router';
import { DashIcon } from "./Icons";
import { useGlobal } from '../contexts/Global';

export default function Header({showItems}) {
  const { sessionJwt } = useGlobal();

  // Define navigation items and their paths
  const navItems = [
    { title: 'Contexts', path: '/', type: "equal" },
    { title: 'Plugins', path: '/plugins', type: "includes" },
    { title: 'Data', path: '/data', type: "includes" },
    { title: 'Settings', path: '/settings', type: "equal" }
  ];

  async function restart() {
    let result = await fetch("/api/restart", {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionJwt}`
      }
    });
    let res = await result.json();
    console.log("res:", res);
    alert("Indexing service restarted.");
  }

  return(
    <div className="bg-white px-12 border-b border-slate-200 w-full flex flex-row items-center">
      <p className="font-monospace mr-4 font-medium">orbisDB</p>
      <DashIcon />
      {showItems ?
        <>
          <div className="flex space-x-9 flex-1 flex-row items-center ml-6 text-sm text-slate-500 h-full">
            {navItems.map((item) => (
              <NavItem key={item.title} item={item} />
            ))}
          </div>
          <div className='pr-4'>
            <Link href="/playground" className='bg-blue-50 border border-dashed hover:border-solid cursor-pointer border-blue-200 text-blue-600 px-3 py-1.5 rounded-md text-sm'>Playground</Link>
          </div>
          <div className='pr-4'>
            <button onClick={() => restart()} className='bg-red-50 border border-dashed hover:border-solid cursor-pointer border-red-200 text-red-600 px-3 py-1 rounded-md text-sm'>Restart</button>
          </div>
        </>
      :
        <div className="flex space-x-9 flex-row items-center ml-6 text-sm text-slate-500 h-full">
          <NavItem key="Configuration" item={{ title: 'Configuration', path: '/', type: "equal" }} />
        </div>
      }
    </div>
  )
}

const NavItem = ({ item, href }) => {
  const router = useRouter();

  // Determine whether the current route matches the item's link
  let selected = false;
  if(item.type == "equal") {
    selected = router.pathname === item.path;
  } else if(item.type == "includes") {
    selected = router.pathname.includes(item.path);
  }

  if (selected) {
    return (
      <Link href={item.path} passHref>
        <div className="text-slate-900 text-base border-b border-slate-900 h-full py-4">{item.title}</div>
      </Link>
    );
  } else {
    return (
      <Link href={item.path} passHref>
        <div className="cursor-pointer hover:text-slate-800 h-full py-4">{item.title}</div>
      </Link>
    );
  }
};
