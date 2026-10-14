'use client';

import { useEffect, useState } from 'react';
import {
  Database, Shield, Bell, Users, Save, Check, Store, FileSpreadsheet,
  HardDrive, Chrome, Cpu, Loader2, RefreshCw, AlertCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDemoMode } from '@/lib/demo-mode';
import {
  settingsService, integrationService, type AppSettings, type IntegrationConfig,
} from '@/lib/services';

export default function SettingsPage() {
  const { demoMode } = useDemoMode();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);
  const [savingIntegration, setSavingIntegration] = useState<string | null>(null);
  const [savedIntegration, setSavedIntegration] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  const [mlCreds, setMlCreds] = useState({ clientId: '', clientSecret: '', refreshToken: '', sellerId: '' });
  const [sheetsCreds, setSheetsCreds] = useState({ serviceAccountEmail: '', privateKey: '', spreadsheetId: '' });
  const [driveCreds, setDriveCreds] = useState({ serviceAccountEmail: '', privateKey: '', folderId: '' });
  const [ollamaSettings, setOllamaSettings] = useState({ host: 'localhost', port: '11434' });

  useEffect(() => {
    Promise.all([settingsService.getSettings(), integrationService.getAll()])
      .then(([s, ints]) => {
        setSettings(s);
        setIntegrations(ints);
        const ml = ints.find((i) => i.id === 'mercadolibre');
        if (ml) {
          setMlCreds({
            clientId: ml.credentials.clientId ?? '',
            clientSecret: ml.credentials.clientSecret ?? '',
            refreshToken: ml.credentials.refreshToken ?? '',
            sellerId: ml.credentials.sellerId ?? ml.settings.sellerId ?? '',
          });
        }
        const sheets = ints.find((i) => i.id === 'google_sheets');
        if (sheets) {
          setSheetsCreds({
            serviceAccountEmail: sheets.credentials.serviceAccountEmail ?? '',
            privateKey: sheets.credentials.privateKey ?? '',
            spreadsheetId: sheets.settings.spreadsheetId ?? '',
          });
        }
        const drive = ints.find((i) => i.id === 'google_drive');
        if (drive) {
          setDriveCreds({
            serviceAccountEmail: drive.credentials.serviceAccountEmail ?? '',
            privateKey: drive.credentials.privateKey ?? '',
            folderId: drive.settings.folderId ?? '',
          });
        }
        const ollama = ints.find((i) => i.id === 'ollama_worker');
        if (ollama) {
          setOllamaSettings({
            host: ollama.settings.host ?? 'localhost',
            port: ollama.settings.port ?? '11434',
          });
        }
        setLoading(false);
      });
  }, []);

  const update = (key: keyof AppSettings, value: boolean) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSavedSettings(false);
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await settingsService.updateSettings(settings);
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 3000);
    } catch (_e) { /* */ }
    setSavingSettings(false);
  };

  const handleSaveIntegration = async (id: string) => {
    setSavingIntegration(id);
    try {
      if (id === 'mercadolibre') {
        await integrationService.update(id, {
          enabled: true,
          credentials: mlCreds,
          settings: { site: 'MLM', accountName: 'MITIENDOTA', sellerId: mlCreds.sellerId },
        });
      } else if (id === 'google_sheets') {
        await integrationService.update(id, {
          enabled: !!sheetsCreds.serviceAccountEmail,
          credentials: { serviceAccountEmail: sheetsCreds.serviceAccountEmail, privateKey: sheetsCreds.privateKey },
          settings: { spreadsheetId: sheetsCreds.spreadsheetId },
        });
      } else if (id === 'google_drive') {
        await integrationService.update(id, {
          enabled: !!driveCreds.serviceAccountEmail,
          credentials: { serviceAccountEmail: driveCreds.serviceAccountEmail, privateKey: driveCreds.privateKey },
          settings: { folderId: driveCreds.folderId },
        });
      } else if (id === 'ollama_worker') {
        await integrationService.update(id, {
          enabled: true,
          settings: ollamaSettings,
        });
      } else if (id === 'chrome_extension') {
        await integrationService.update(id, {
          enabled: true,
        });
      }
      setSavedIntegration(id);
      setTimeout(() => setSavedIntegration(null), 3000);
      const updated = await integrationService.getAll();
      setIntegrations(updated);
    } catch (_e) { /* */ }
    setSavingIntegration(null);
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const result = await integrationService.testConnection(id);
      setTestResult((prev) => ({ ...prev, [id]: result }));
    } catch (_e) {
      setTestResult((prev) => ({ ...prev, [id]: { success: false, message: 'Error de conexion' } }));
    }
    setTestingId(null);
  };

  const getInt = (id: string) => integrations.find((i) => i.id === id);

  return (
    <AppShell>
      <PageHeader
        title="Configuracion"
        description="Preferencias del sistema, integraciones y conexion con base de datos."
        actions={
          <Button size="sm" onClick={handleSaveSettings} disabled={loading || savingSettings}>
            {savedSettings ? (
              <><Check className="mr-1.5 h-4 w-4" />Guardado</>
            ) : (
              <><Save className="mr-1.5 h-4 w-4" />Guardar preferencias</>
            )}
          </Button>
        }
      />
      <div className="p-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="flex h-auto flex-wrap bg-muted/60">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="mercadolibre">MercadoLibre</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="worker">Worker IA</TabsTrigger>
            <TabsTrigger value="database">Base de datos</TabsTrigger>
          </TabsList>

          {/* General */}
          <TabsContent value="general" className="mt-4 space-y-4 max-w-3xl">
            {loading ? (
              <div className="h-48 animate-pulse rounded-lg border bg-muted/40" />
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4" />Seguridad
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="rate-limit" className="text-sm">Rate limiting en API</Label>
                      <Switch id="rate-limit" checked={settings?.rateLimiting ?? true} onCheckedChange={(v) => update('rateLimiting', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="csrf" className="text-sm">Proteccion CSRF</Label>
                      <Switch id="csrf" checked={settings?.csrfProtection ?? true} onCheckedChange={(v) => update('csrfProtection', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="audit-log" className="text-sm">Registro de auditoria</Label>
                      <Switch id="audit-log" checked={settings?.auditLogging ?? true} onCheckedChange={(v) => update('auditLogging', v)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4" />Notificaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notif-jobs" className="text-sm">Alertas de trabajos fallidos</Label>
                      <Switch id="notif-jobs" checked={settings?.notifJobsFailed ?? true} onCheckedChange={(v) => update('notifJobsFailed', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notif-dup" className="text-sm">Alertas de duplicados detectados</Label>
                      <Switch id="notif-dup" checked={settings?.notifDuplicates ?? true} onCheckedChange={(v) => update('notifDuplicates', v)} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />Roles y permisos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Roles disponibles: OWNER, ADMIN, CATALOG_MANAGER, INVENTORY_MANAGER, REVIEWER, OPERATOR, VIEWER.</p>
                    <p>La gestion detallada de usuarios estara disponible en la siguiente fase.</p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* MercadoLibre */}
          <TabsContent value="mercadolibre" className="mt-4 max-w-2xl">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Store className="h-4 w-4" />MercadoLibre - MITIENDOTA
                </CardTitle>
                <Badge variant={getInt('mercadolibre')?.enabled ? 'default' : 'secondary'}>
                  {getInt('mercadolibre')?.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Client ID</Label>
                    <Input
                      value={mlCreds.clientId}
                      onChange={(e) => setMlCreds({ ...mlCreds, clientId: e.target.value })}
                      placeholder="App ID de MercadoLibre"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Client Secret</Label>
                    <Input
                      type="password"
                      value={mlCreds.clientSecret}
                      onChange={(e) => setMlCreds({ ...mlCreds, clientSecret: e.target.value })}
                      placeholder="Secret key"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Refresh Token</Label>
                    <Input
                      type="password"
                      value={mlCreds.refreshToken}
                      onChange={(e) => setMlCreds({ ...mlCreds, refreshToken: e.target.value })}
                      placeholder="Token de refresco"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Seller ID</Label>
                    <Input
                      value={mlCreds.sellerId}
                      onChange={(e) => setMlCreds({ ...mlCreds, sellerId: e.target.value })}
                      placeholder="Ej. MLM123456789"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                  Obtienes estas credenciales en el portal de desarrolladores de MercadoLibre (developers.mercadolivre.com.mx).
                  Crea una aplicacion y copia el Client ID, Secret y genera un Refresh Token via OAuth.
                </div>
                {testResult.mercadolibre && (
                  <div className={`rounded-md p-3 text-xs ${testResult.mercadolibre.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                    {testResult.mercadolibre.message}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleSaveIntegration('mercadolibre')} disabled={savingIntegration === 'mercadolibre'}>
                    {savedIntegration === 'mercadolibre' ? <><Check className="mr-1.5 h-4 w-4" />Guardado</> : <><Save className="mr-1.5 h-4 w-4" />Guardar credenciales</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTestConnection('mercadolibre')} disabled={testingId === 'mercadolibre'}>
                    {testingId === 'mercadolibre' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                    Probar conexion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google */}
          <TabsContent value="google" className="mt-4 space-y-4 max-w-2xl">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4" />Google Sheets
                </CardTitle>
                <Badge variant={getInt('google_sheets')?.enabled ? 'default' : 'secondary'}>
                  {getInt('google_sheets')?.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Service Account Email</Label>
                    <Input
                      value={sheetsCreds.serviceAccountEmail}
                      onChange={(e) => setSheetsCreds({ ...sheetsCreds, serviceAccountEmail: e.target.value })}
                      placeholder="catalogai@proyecto.iam.gserviceaccount.com"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Private Key</Label>
                    <Input
                      type="password"
                      value={sheetsCreds.privateKey}
                      onChange={(e) => setSheetsCreds({ ...sheetsCreds, privateKey: e.target.value })}
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Spreadsheet ID</Label>
                    <Input
                      value={sheetsCreds.spreadsheetId}
                      onChange={(e) => setSheetsCreds({ ...sheetsCreds, spreadsheetId: e.target.value })}
                      placeholder="ID del Google Sheet"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
                {testResult.google_sheets && (
                  <div className={`rounded-md p-3 text-xs ${testResult.google_sheets.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                    {testResult.google_sheets.message}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleSaveIntegration('google_sheets')} disabled={savingIntegration === 'google_sheets'}>
                    {savedIntegration === 'google_sheets' ? <><Check className="mr-1.5 h-4 w-4" />Guardado</> : <><Save className="mr-1.5 h-4 w-4" />Guardar</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTestConnection('google_sheets')} disabled={testingId === 'google_sheets'}>
                    {testingId === 'google_sheets' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                    Probar conexion
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <HardDrive className="h-4 w-4" />Google Drive
                </CardTitle>
                <Badge variant={getInt('google_drive')?.enabled ? 'default' : 'secondary'}>
                  {getInt('google_drive')?.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Service Account Email</Label>
                    <Input
                      value={driveCreds.serviceAccountEmail}
                      onChange={(e) => setDriveCreds({ ...driveCreds, serviceAccountEmail: e.target.value })}
                      placeholder="catalogai@proyecto.iam.gserviceaccount.com"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Private Key</Label>
                    <Input
                      type="password"
                      value={driveCreds.privateKey}
                      onChange={(e) => setDriveCreds({ ...driveCreds, privateKey: e.target.value })}
                      placeholder="-----BEGIN PRIVATE KEY-----"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Folder ID</Label>
                    <Input
                      value={driveCreds.folderId}
                      onChange={(e) => setDriveCreds({ ...driveCreds, folderId: e.target.value })}
                      placeholder="ID de la carpeta en Drive"
                      className="h-9 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                  Comparte la carpeta de Drive con el Service Account Email para que la aplicacion pueda leer y escribir archivos.
                </div>
                {testResult.google_drive && (
                  <div className={`rounded-md p-3 text-xs ${testResult.google_drive.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                    {testResult.google_drive.message}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleSaveIntegration('google_drive')} disabled={savingIntegration === 'google_drive'}>
                    {savedIntegration === 'google_drive' ? <><Check className="mr-1.5 h-4 w-4" />Guardado</> : <><Save className="mr-1.5 h-4 w-4" />Guardar</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTestConnection('google_drive')} disabled={testingId === 'google_drive'}>
                    {testingId === 'google_drive' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                    Probar conexion
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Worker IA */}
          <TabsContent value="worker" className="mt-4 max-w-2xl">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4" />Ollama Worker (Fedora)
                </CardTitle>
                <Badge variant={getInt('ollama_worker')?.enabled ? 'default' : 'secondary'}>
                  {getInt('ollama_worker')?.enabled ? 'Activo' : 'Inactivo'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Host</Label>
                    <Input
                      value={ollamaSettings.host}
                      onChange={(e) => setOllamaSettings({ ...ollamaSettings, host: e.target.value })}
                      placeholder="localhost o IP del servidor"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Puerto</Label>
                    <Input
                      value={ollamaSettings.port}
                      onChange={(e) => setOllamaSettings({ ...ollamaSettings, port: e.target.value })}
                      placeholder="11434"
                      className="h-9 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                  El worker de Ollama corre en tu servidor Fedora local. La prueba de conexion se ejecuta desde la nube de Supabase,
                  por lo que el host debe ser una IP publica o un dominio accesible desde internet (no un nombre de red local como &quot;xeonfedoraserver&quot;).
                  Si tu servidor esta detras de un router, configura port forwarding en el puerto 11434 o usa un tunnel (ej. Cloudflare Tunnel, Tailscale).
                </div>
                {testResult.ollama_worker && (
                  <div className={`rounded-md p-3 text-xs ${testResult.ollama_worker.success ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'}`}>
                    {testResult.ollama_worker.message}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => handleSaveIntegration('ollama_worker')} disabled={savingIntegration === 'ollama_worker'}>
                    {savedIntegration === 'ollama_worker' ? <><Check className="mr-1.5 h-4 w-4" />Guardado</> : <><Save className="mr-1.5 h-4 w-4" />Guardar</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleTestConnection('ollama_worker')} disabled={testingId === 'ollama_worker'}>
                    {testingId === 'ollama_worker' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                    Probar conexion
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Chrome className="h-4 w-4" />Extension Chrome
                </CardTitle>
                <Badge variant={getInt('chrome_extension')?.enabled ? 'default' : 'secondary'}>
                  {getInt('chrome_extension')?.enabled ? 'Instalada' : 'No instalada'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
                  La extension de Chrome se instala en modo desarrollador. Una vez instalada, podras capturar productos
                  desde cualquier pagina web y enviarlos directamente al catalogo. Los productos capturados aparecen
                  en la seccion de Capturas dentro de CatalogAI.
                </div>
                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-xs font-medium">Instrucciones de instalacion:</p>
                  <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
                    <li>Descarga la carpeta <code className="rounded bg-muted px-1">chrome-extension/</code> de este proyecto</li>
                    <li>Abre <code className="rounded bg-muted px-1">chrome://extensions/</code> en Chrome</li>
                    <li>Activa el &quot;Modo desarrollador&quot; (esquina superior derecha)</li>
                    <li>Haz clic en &quot;Cargar descomprimida&quot; y selecciona la carpeta</li>
                    <li>Configura la URL y Anon Key de Supabase en el popup de la extension</li>
                  </ol>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      window.open('/chrome-extension/README.md', '_blank');
                    }}
                  >
                    <Chrome className="mr-1.5 h-4 w-4" />
                    Ver instrucciones
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveIntegration('chrome_extension')}
                    disabled={savingIntegration === 'chrome_extension'}
                  >
                    {savedIntegration === 'chrome_extension' ? (
                      <><Check className="mr-1.5 h-4 w-4" />Guardado</>
                    ) : (
                      <><Save className="mr-1.5 h-4 w-4" />Marcar como instalada</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database */}
          <TabsContent value="database" className="mt-4 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Database className="h-4 w-4" />Conexion de base de datos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Motor</p>
                    <p className="text-xs text-muted-foreground">PostgreSQL 15 via Supabase</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {demoMode ? 'Modo Demo' : 'Conectado'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <div>
                    <p className="font-medium">Host</p>
                    <p className="text-xs text-muted-foreground font-mono">ddtdgakvjospwoopdjds.supabase.co</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Region</p>
                    <p className="text-xs text-muted-foreground">us-east-1</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pooler de conexiones</p>
                    <p className="text-xs text-muted-foreground">Activo (PgBouncer)</p>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Activo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">RLS (Row Level Security)</p>
                    <p className="text-xs text-muted-foreground">Habilitado en todas las tablas</p>
                  </div>
                  <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Activo
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Estado de migraciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Esquema del catalogo</span>
                  <Badge variant="default">Aplicado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tabla de configuracion</span>
                  <Badge variant="default">Aplicado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tabla de integraciones</span>
                  <Badge variant="default">Aplicado</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Edge function: test-ollama</span>
                  <Badge variant="default">Desplegada</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  Informacion de produccion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>La base de datos esta alojada en Supabase con respaldo automatico diario y replicacion en tiempo real.</p>
                <p>Las credenciales de integracion se almacenan de forma segura en la tabla de configuracion de integraciones.</p>
                <p>Para acceso directo a la consola de Supabase, visita supabase.com/dashboard.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
