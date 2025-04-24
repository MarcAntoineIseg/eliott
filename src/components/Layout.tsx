
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { FileText, Settings } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  
  const menuItems = [
    {
      title: "Requête",
      icon: FileText,
      path: "/request"
    },
    {
      title: "Intégration",
      icon: Settings,
      path: "/integration"
    }
  ]

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-[#f8fafc]">
        <Sidebar>
          <SidebarHeader className="border-b border-border/5">
            <div className="flex items-center gap-2 px-4 py-2">
              <img src="/lovable-uploads/e05ae0d2-62b8-4d50-8a6c-02959677f424.png" alt="Logo" className="w-8 h-8" />
              <span className="font-semibold">Eliott</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton 
                        asChild
                        isActive={location.pathname === item.path}
                      >
                        <Link to={item.path}>
                          <item.icon className="shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default Layout
