import { Settings, Shield, Database, Bell, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader
        title="Configuracion"
        description="Preferencias del sistema, seguridad y conexion con base de datos."
      />
      <div className="p-6 space-y-4 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4" />
              Base de datos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Motor de base de datos</p>
                <p className="text-xs text-muted-foreground">
                  MySQL via Prisma ORM (SiteGround). PostgreSQL preparado para futuro.
                </p>
              </div>
              <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Demo (sin conexion)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="rate-limit" className="text-sm">
                Rate limiting en API
              </Label>
              <Switch id="rate-limit" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="csrf" className="text-sm">
                Proteccion CSRF
              </Label>
              <Switch id="csrf" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="audit-log" className="text-sm">
                Registro de auditoria
              </Label>
              <Switch id="audit-log" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              Roles y permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Roles disponibles: OWNER, ADMIN, CATALOG_MANAGER, INVENTORY_MANAGER, REVIEWER, OPERATOR, VIEWER.</p>
            <p>La gestion detallada de usuarios estara disponible en la siguiente fase.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-jobs" className="text-sm">
                Alertas de trabajos fallidos
              </Label>
              <Switch id="notif-jobs" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notif-dup" className="text-sm">
                Alertas de duplicados detectados
              </Label>
              <Switch id="notif-dup" defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
