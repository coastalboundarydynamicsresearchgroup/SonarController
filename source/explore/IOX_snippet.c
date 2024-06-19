

//--------------------- from file read section ---------------------------------

	nToRead = 100 + (pbBuf[6]<<8) | pbBuf[7];

	if(ser_buf[1]==0x4F) {	//IOX mode
		//starts at Byte 129
      fptr = &pbBuf[nToRead+0];						//Byte 129-132
		fpitch_offset = *fptr;
      fptr = &pbBuf[nToRead+4];						//Byte 133-136
		froll_offset = *fptr;
      fptr = &pbBuf[nToRead+8];						//Byte 137-140
		fheading_offset = *fptr;
		use_gyro = pbBuf[nToRead+12];            	//Byte 141
		om_time = (pbBuf[nToRead+13]<<8) |			//Byte 142-143
      			  pbBuf[nToRead+14];
      fptr = &pbBuf[nToRead+15];						//Byte 144-147
   	flatitude_playback = *fptr;
      fptr = &pbBuf[nToRead+19];						//Byte 148-151
      fheading_at_reset = *fptr;
      fptr = &pbBuf[nToRead+23];						//Byte 152-155
      fheading_with_gyro  = *fptr;
   }

//------------------------------------------------------------------------------

void Decode_IOX(void)
{
   om_version = ser_buf[7];	//added 18JUL08
   									//0 - Original
                              //1 - add Microstrain 3DM-GX1 Interface
                              //2 - add KVH DSP-3000 Fiber Optic Gyro Interface

   //------------------------------ Pitch --------------------------------------
   temp = ((ser_buf[19]&0x7F)<<7) | (ser_buf[18]&0x7F);
   fpitch_val = (temp-900.0)/10.0;
	fpitch_val+=fpitch_offset;
	if(fpitch_val>90.0) fpitch_val = 90.0;
	if(fpitch_val<-90.0) fpitch_val = -90.0;
   //---------------------------------------------------------------------------

   //------------------------------ Roll ---------------------------------------
   temp = ((ser_buf[21]&0x7F)<<7) | (ser_buf[20]&0x7F);
   froll_val = (temp-900.0)/10.0;
   if(om_version==0) {
		if(xdcr_up_down==DOWN) froll_val = -froll_val;
   }
	froll_val+=froll_offset;
	if(froll_val>90.0) froll_val = 90.0;
	if(froll_val<-90.0) froll_val = -90.0;
   //---------------------------------------------------------------------------

   //---------------------------- Heading --------------------------------------
	if(om_version>=2 && use_gyro==ON) {
   	//see Gyro Heading below
   }
   else {
	   temp = ((ser_buf[23]&0x7F)<<7) | (ser_buf[22]&0x7F);
   	ftemp = temp/10.0;
	   if(ftemp<0.0) ftemp = 0.0;
   	if(ftemp>359.9) ftemp = 359.9;
	   fheading_val = ftemp;
   	if(om_version==0) {	//18JUL08
   		if(xdcr_up_down==DOWN) fheading_val = 360.0-fheading_val;	/*10JUL06*/
	   }
		fheading_val+=fheading_offset;
		if(fheading_val>=360.0) fheading_val-=360.0;
		if(fheading_val<0.0) fheading_val+=360.0;
	}
   //---------------------------------------------------------------------------

   //---------------------------- Depth ----------------------------------------
   //meters_of_sea_water = 0.3048 * PSI / 0.444
   //PSI = 0.444 * meters_of_sea_water / 0.3048
   //0 to 300PSI --> meters_of_sea_water = 0.3048 * 300 / 0.444 = 205.9 meters
   temp = ((ser_buf[17]&0x7F)<<7) | (ser_buf[16]&0x7F);
   ftemp = temp/10.0;
   if(ftemp>205.9) ftemp = 205.9;
	fdepth_val = ftemp;
   fpsi_val = 0.444 * fdepth / 0.3048;
   //---------------------------------------------------------------------------

   //---------------------------- Gyro Heading ---------------------------------
   if(om_version>=2) {
   	temp = ((ser_buf[25]&0x7F)<<7) | (ser_buf[24]&0x7F);
	   ftemp = temp/10.0;
   	if(ftemp<0.0) ftemp = 0.0;
	   if(ftemp>359.9) ftemp = 359.9;
   	fgyro_heading_val = ftemp;
      if(xdcr_up_down==UP) fgyro_heading_val = 360.0-fgyro_heading_val;

      flat = flatitude_playback;

		/************************* Remove Earth Rate ****************************/
      earth_rate = -15.04107 * sin(flat*PI/180.0);	//deg/hour
      earth_rate/=3600.0;									//deg/s --> for a ~1Hz gyro rate
      earth_rate*=(om_time/1000.0);	//scale the correction to measured orientation module rep-rate
		earth_rate_acc+=earth_rate;
		fgyro_heading_val-=earth_rate_acc;
      if(fgyro_heading_val>=360.0) fgyro_heading_val-=360.0;
		if(fgyro_heading_val<0.0) fgyro_heading_val+=360.0;
		/************************************************************************/

   }
   //---------------------------------------------------------------------------
}
 