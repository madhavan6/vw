import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useState } from 'react';

interface AdminConfig {
  maxPossibleActivity: number;
  mouseWeight: number;
  keyboardWeight: number;
}

interface AdminConfigPanelProps {
  config: AdminConfig;
  onConfigChange: (config: AdminConfig) => void;
}

export function AdminConfigPanel({ config, onConfigChange }: AdminConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<AdminConfig>({
    maxPossibleActivity: config.maxPossibleActivity,
    mouseWeight: config.mouseWeight,
    keyboardWeight: config.keyboardWeight,
  });

  const handleSave = () => {
    onConfigChange({
      maxPossibleActivity: Number(localConfig.maxPossibleActivity),
      mouseWeight: Number(localConfig.mouseWeight),
      keyboardWeight: Number(localConfig.keyboardWeight),
    });
    setIsOpen(false);
  };

  const handleChange = (field: keyof AdminConfig, value: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings className="h-4 w-4" />
        Admin Configuration
      </Button>

      {isOpen && (
        <div className="mt-2">
          <Card>
            <CardHeader>
              <CardTitle>Activity Formula Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxActivity">Max Possible Activity</Label>
                  <Input
                    id="maxActivity"
                    type="number"
                    min="1"
                    value={localConfig.maxPossibleActivity}
                    onChange={(e) => handleChange('maxPossibleActivity', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mouseWeight">Mouse Click Weight</Label>
                  <Input
                    id="mouseWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localConfig.mouseWeight}
                    onChange={(e) => handleChange('mouseWeight', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keyboardWeight">Keyboard Press Weight</Label>
                  <Input
                    id="keyboardWeight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={localConfig.keyboardWeight}
                    onChange={(e) => handleChange('keyboardWeight', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

}
