export type LandedCostInput={
  quantity:number; unitPrice:number; freight?:number; handling?:number; customs?:number; insurance?:number; other?:number; platformFeePct?:number;
};
export type LandedCostResult={goods:number;platformFee:number;extras:number;total:number;unit:number};
const n=(v:unknown)=>{const x=Number(v??0);return Number.isFinite(x)?Math.max(0,x):0};
export function calculateLandedCost(input:LandedCostInput):LandedCostResult{
  const quantity=n(input.quantity),unitPrice=n(input.unitPrice),goods=quantity*unitPrice;
  const platformFee=goods*n(input.platformFeePct)/100;
  const extras=n(input.freight)+n(input.handling)+n(input.customs)+n(input.insurance)+n(input.other);
  const total=goods+platformFee+extras;
  return{goods,platformFee,extras,total,unit:quantity>0?total/quantity:0};
}
