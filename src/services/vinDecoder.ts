import type { VinDecodeResponse } from '../types/models';

class VinDecoderService {
  private baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevin';

  async decodeVin(vin: string): Promise<VinDecodeResponse> {
    if (!vin || vin.length !== 17) {
      throw new Error('Invalid VIN format. VIN must be 17 characters.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${vin}?format=json`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.Results || data.Results.length === 0) {
        throw new Error('No vehicle data found for this VIN');
      }

      // Convert the array of results into a more usable object
      const resultObj: Record<string, string> = {};
      data.Results.forEach((item: any) => {
        if (item.Value && item.Value !== 'Not Applicable' && item.Value !== '') {
          resultObj[item.Variable] = item.Value;
        }
      });

      // Map to our expected interface
      const decodedData: VinDecodeResponse = {
        Make: resultObj.Make,
        Model: resultObj.Model,
        ModelYear: resultObj['Model Year'],
        EngineHP: resultObj['Engine Power (kW)'] || resultObj['Engine Power (HP)'],
        EngineCylinders: resultObj['Engine Number of Cylinders'],
        EngineL: resultObj['Displacement (L)'],
        Trim: resultObj.Trim,
      };

      // Check for errors in the response
      if (data.Results.some((item: any) => item.ErrorCode && item.ErrorCode !== "0")) {
        const errorItem = data.Results.find((item: any) => item.ErrorCode && item.ErrorCode !== "0");
        decodedData.ErrorCode = errorItem.ErrorCode;
        decodedData.ErrorText = errorItem.ErrorText;
      }

      return decodedData;
    } catch (error) {
      console.error('VIN decode error:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to decode VIN');
    }
  }

  // Validate VIN format (basic check)
  isValidVin(vin: string): boolean {
    if (!vin || vin.length !== 17) {
      return false;
    }

    // Basic VIN validation - no I, O, or Q allowed
    const forbiddenChars = /[IOQ]/gi;
    if (forbiddenChars.test(vin)) {
      return false;
    }

    // Should be alphanumeric
    const validChars = /^[A-HJ-NPR-Z0-9]+$/i;
    return validChars.test(vin);
  }

  // Format VIN for display (add spaces for readability)
  formatVin(vin: string): string {
    if (vin.length === 17) {
      return `${vin.slice(0, 3)} ${vin.slice(3, 9)} ${vin.slice(9, 17)}`;
    }
    return vin;
  }

  // Clean VIN input (remove spaces, special chars, convert to uppercase)
  cleanVin(input: string): string {
    return input.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase();
  }
}

export default new VinDecoderService();