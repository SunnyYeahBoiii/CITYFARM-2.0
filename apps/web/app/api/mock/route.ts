import { NextResponse } from "next/server";
import { cityFarmDataset } from "../../../lib/cityfarm-data";

export function GET() {
  return NextResponse.json(cityFarmDataset);
}
