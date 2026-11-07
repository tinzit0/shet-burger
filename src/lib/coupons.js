import { supabase } from './supabase';
import { normalizeCouponCode } from './couponRules';

export const loadCoupons = (token = null, admin = false) => admin
  ? supabase.rpc('admin_list_coupons', { p_token: token })
  : supabase.from('coupons').select('*').eq('active', true).eq('published', true).order('created_at', { ascending: false });

export const findCoupon = code => supabase.from('coupons').select('*').eq('code', normalizeCouponCode(code)).maybeSingle();

export const saveCoupon = (coupon, token = null) => supabase.rpc('admin_save_coupon', {
  p_coupon: { ...coupon, code: normalizeCouponCode(coupon.code) }, p_token: token,
});
