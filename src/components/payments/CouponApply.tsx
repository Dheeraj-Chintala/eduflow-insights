import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CouponApplyProps {
  courseId?: string;
  originalPrice: number;
  currency?: string;
  onApply: (coupon: any, discountAmount: number) => void;
  onRemove: () => void;
  appliedCoupon?: any;
}

export default function CouponApply({
  courseId,
  originalPrice,
  currency = 'INR',
  onApply,
  onRemove,
  appliedCoupon,
}: CouponApplyProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsValidating(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast.error('Invalid coupon code');
        return;
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        toast.error('This coupon is not yet valid');
        return;
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        toast.error('This coupon has expired');
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        toast.error('This coupon has reached its usage limit');
        return;
      }

      // Check minimum purchase amount
      if (coupon.min_purchase_amount && originalPrice < coupon.min_purchase_amount) {
        toast.error(`Minimum purchase amount is ${formatCurrency(coupon.min_purchase_amount, currency)}`);
        return;
      }

      // Check if applicable to this course
      if (courseId && coupon.applicable_courses && coupon.applicable_courses.length > 0) {
        if (!coupon.applicable_courses.includes(courseId)) {
          toast.error('This coupon is not applicable to this course');
          return;
        }
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (originalPrice * coupon.discount_value) / 100;
        if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
          discountAmount = coupon.max_discount_amount;
        }
      } else {
        discountAmount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed original price
      discountAmount = Math.min(discountAmount, originalPrice);

      onApply(coupon, discountAmount);
      toast.success('Coupon applied successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to validate coupon');
    } finally {
      setIsValidating(false);
    }
  };

  const formatCurrency = (amount: number, curr: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  const handleRemove = () => {
    setCouponCode('');
    onRemove();
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <div>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <Ticket className="h-3 w-3 mr-1" />
              {appliedCoupon.code}
            </Badge>
            <p className="text-xs text-green-700 mt-1">
              {appliedCoupon.discount_type === 'percentage'
                ? `${appliedCoupon.discount_value}% off`
                : `${formatCurrency(appliedCoupon.discount_value, currency)} off`}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="pl-10 uppercase"
            onKeyPress={(e) => e.key === 'Enter' && validateAndApplyCoupon()}
          />
        </div>
        <Button
          onClick={validateAndApplyCoupon}
          disabled={isValidating || !couponCode.trim()}
          variant="outline"
        >
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
    </div>
  );
}
