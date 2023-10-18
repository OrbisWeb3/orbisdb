import { DashIcon } from "./Icons";

export default function Header() {
  return(
    <div className="bg-white px-12 border-b border-slate-200 w-full flex flex-row items-center">
      <p className="font-monospace mr-4">orbisDB</p>
      <DashIcon />
      <div className="flex space-x-9 flex-row items-center ml-6 text-sm text-slate-500 h-full">
        <NavItem title="Project" selected={true} />
        <div>Data</div>
        <div>Contexts</div>
        <div>Plugins</div>
        <div>Settings</div>
      </div>
    </div>
  )
}

const NavItem = ({selected, title}) => {
  if(selected) {
    return(
      <div className="text-slate-900 text-base border-b border-slate-900 h-full py-4">{title}</div>
    )
  } else {
    return(
      <div>{title}</div>
    )
  }

}
