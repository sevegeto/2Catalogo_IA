'use client';

import { useEffect, useState } from 'react';
import { Database, Shield, Bell, Users, Save, Check } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useDemoMode } from '@/lib/demo-mode';
import { settingsService, type AppSettings } from '@/lib/services';

export default function SettingsPage() {
  const { demoMode } = useDemoMode();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const update = (key: keyof AppSettings, value: boolean) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaving(false);
    }
    setSaving(false);
  };

  return (
    <AppShell>
      <PageHeader
        title="Configuracion"
        description="Preferencias del sistema, seguridad y conexion con base de datos."
        actions={
          <Button size="sm" onClick={handleSave} disabled={loading || saving}>
            {saved ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Guardado
              </>
            ) : (
              <>
                <Save className="mr-1.5 h-4 w-4" />
                Guardar
              </>
            )}
          </Button>
        }
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
                  PostgreSQL via Supabase. Conexion activa y operativa.
                </p>
              </div>
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                {demoMode ? 'Modo Demo' : 'Conectado'}
              </span>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="h-48 animate-pulse rounded-lg border bg-muted/40" />
        ) : (
          <>
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
                  <Switch
                    id="rate-limit"
                    checked={settings?.rateLimiting ?? true}
                    onCheckedChange={(v) => update('rateLimiting', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="csrf" className="text-sm">
                    Proteccion CSRF
                  </Label>
                  <Switch
                    id="csrf"
                    checked={settings?.csrfProtection ?? true}
                    onCheckedChange={(v) => update('csrfProtection', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="audit-log" className="text-sm">
                    Registro de auditoria
                  </Label>
                  <Switch
                    id="audit-log"
                    checked={settings?.auditLogging ?? true}
                    onCheckedChange={(v) => update('auditLogging', v)}
                  />
                </div>
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
                  <Switch
                    id="notif-jobs"
                    checked={settings?.notifJobsFailed ?? true}
                    onCheckedChange={(v) => update('notifJobsFailed', v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notif-dup" className="text-sm">
                    Alertas de duplicados detectados
                  </Label>
                  <Switch
                    id="notif-dup"
                    checked={settings?.notifDuplicates ?? true}
                    onCheckedChange={(v) => update('notifDuplicates', v)}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

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
      </div>
    </AppShell>
  );
}
