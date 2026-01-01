import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Package } from 'lucide-react';

const EcommercePanel: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">E-commerce Management</CardTitle>
        <Badge variant="secondary">v2.0</Badge>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <div className="p-6 rounded-full bg-secondary/20 mb-4">
          <Package className="h-12 w-12 opacity-70" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Coming in v2</h3>
        <p className="text-sm text-center max-w-sm">
          Advanced e-commerce management features including inventory tracking, order processing, and product analytics will be available in the next major release.
        </p>
      </CardContent>
    </Card>
  );
};

export default EcommercePanel;
