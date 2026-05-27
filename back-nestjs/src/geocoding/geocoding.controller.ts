import { Controller, Get, Query, UsePipes, ValidationPipe } from "@nestjs/common";
import {
  GeocodingByMagicKeyQueryDto,
  GeocodingSuggestQueryDto,
} from "./dto/geocoding-query.dto";
import { GeocodingService } from "./geocoding.service";

@Controller("geocoding")
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get("suggest")
  @UsePipes(new ValidationPipe({ transform: true }))
  async suggest(@Query() query: GeocodingSuggestQueryDto) {
    return this.geocodingService.suggest(query.text);
  }

  @Get("geocode")
  @UsePipes(new ValidationPipe({ transform: true }))
  async geocode(@Query() query: GeocodingByMagicKeyQueryDto) {
    return this.geocodingService.geocodeByMagicKey(query.magicKey);
  }
}
