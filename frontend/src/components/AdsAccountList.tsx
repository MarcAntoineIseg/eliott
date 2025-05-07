
import React from 'react';
import { Button } from '@/components/ui/button';
import { GoogleAdsAccount } from '@/services/googleAds';
import { Skeleton } from '@/components/ui/skeleton';

interface AdsAccountListProps {
  accounts: GoogleAdsAccount[];
  isLoading: boolean;
  error: string | null;
  onSelectAccount: (account: GoogleAdsAccount) => void;
}

const AdsAccountList = ({ accounts, isLoading, error, onSelectAccount }: AdsAccountListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-48 mb-2" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4 border border-red-300 rounded-md">{error}</div>;
  }

  if (!accounts || accounts.length === 0) {
    return <p className="text-gray-500 py-2">Aucun compte Google Ads trouvé.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-gray-700">Comptes disponibles ({accounts.length})</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">{account.name}</h4>
                <p className="text-xs text-gray-500">{account.customerId}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectAccount(account)}
                className="ml-2"
              >
                Connecter
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdsAccountList;
