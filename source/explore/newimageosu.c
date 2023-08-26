/*****************************************************************************
**  newimageosu.c 
**  
**  this program will take sections from test881a 
**  and bathym7am and combine them for a version
**  for Diane Foster
**   
**  the two modes to implement are looking straight down collecting backscatter
**  and the 3-d mode which includes radial and azimuthal scanning
**
**  add watchdog timer later if nec
**
**  pin 39 used as power turn on pin for 2 axis 881a
**  pin 41 will be used for second power control when 422 used for comm.
**
**  for radial/azimuthal (3d) mode, pencil beam from -90 to 90 degrees, 
**  so train angle must be 0 and sector width 180  (hardwired in pingta)
**
**  currently 250 hard wired as number of points i.e. 25, in set_hdr_type
**
**  Note that to use the new 2 Gig flash card, we need a cf2 with version 2.28b2 or better
**  need to set sys.cfextra=PC for use of 2 Gig card and for regular flash would set 
**  sys.cfextra = (return i.e. blank)  see green notebook in Jim's lab
**
******************************************************************************/
//
//  Discussion with Diane Foster
//  
//  add azimuth angle width choice to parameters
//  no low power necessary
//  3-D mode every n hours and downward mode for m minutes after, both can be zero
//  sending files out serial port, no storage this version
//  she wants to average (add later)
//
/*****************************************************************************
//  notes:
//  make sure there's a BS subdirectory for backscatter files on the flash
//  restore 38400 baud rate
//  rightaway=TRUE overrides start time.  will be hourly from start of program.
//  down is 0 for polar (rotary)
//  0 for azimuth is when red side toward label at top of black can
/*****************************************************************************/

//  changes since May email backup
//  6/04  turning off sonar during send data code
//  6/04  changing hours between 3d to seconds between 3d ...
//        (10 min per complete 3d scan so 4/hr fine if secbetw is 120 or less)
//  6/04  right into downward if threed(mode)val is 0
//        right into 3d if sec downward is 0 
//  6/04  separate params for downward mode
//  6/04  needs to happen immediately and then start the 'seconds after' schedule

/*****************************************************************************/

#include	<cfxbios.h>		// Persistor BIOS and I/O Definitions
#include	<cfxpico.h>		// Persistor PicoDOS Definitions

#include	<assert.h>
#include	<ctype.h>
#include	<errno.h>
#include	<float.h>
#include	<limits.h>
#include	<locale.h>
#include	<math.h>
#include	<setjmp.h>
#include	<signal.h>
#include	<stdarg.h>
#include	<stddef.h>
#include	<stdio.h>
#include	<stdlib.h>
#include	<string.h>
#include	<time.h>

#include	<dirent.h>		// PicoDOS POSIX-like Directory Access Defines
#include	<dosdrive.h>	// PicoDOS DOS Drive and Directory Definitions
#include	<fcntl.h>		// PicoDOS POSIX-like File Access Definitions
#include	<stat.h>		// PicoDOS POSIX-like File Status Definitions
#include	<termios.h>		// PicoDOS POSIX-like Terminal I/O Definitions
#include	<unistd.h>		// PicoDOS POSIX-like UNIX Function Definitions

#include    "c:\cf2code\twoaxissonar\run2003twoaxis.h"   //header file for 2 axis imagenex sonar
#include    <max146.h>

//*****************************************************************************

#define TRUE          1
#define FALSE         0
#define	SYSCLK		  20000				// choose: 160 to 32000 (kHz)
#define	WTMODE		  nsStdSmallBusAdj	// choose: nsMotoSpecAdj or nsStdSmallBusAdj
#define	LPMODE		  FastStop			// choose: FullStop or FastStop or CPUStop
#define SONARPOWER    39     /* pin to turn on power to the two axis sonar  */
#define SCI485POWER   41     /* pin to turn on 485 power for Diane to talk over long cable */
#define MINAFTERHR    0      /* minute after the hour to turn on sonar           */
#define SER_RETTA_SIZE 4096  /* to make sure we don't have endless loop when data comes from 881a */
#define SER_RET_SIZE 4096  /* to make sure we don't have endless loop when data comes from 881a */
#define SONARTACHAN   2      /* tpu channel to talk to 2 axis 881A */
#define SONARTAAZCHAN 9      /* will use same tpu chan as 881a but for azimuth - see send_sw_data */
//switch to tpu for above 2 defines
#define FILENAMELEN 16
#define SONARTIMEOUT 400  
#define PREFIX  "\\BS\\BS"      /* this is the prefix for the backscatter file name */
                                /* need double slash for a slash since \ is a control char in C */
#define PREFIX3D  "\\TA\\XX"    /* this is the prefix for the file name for the 3D mode */
                                /* need double slash for a slash since \ is a control char in C */
                                
#define LONGINITWAIT 15000
#define SHORTINITWAIT  500
#define SHORTERINITWAIT  100

#define MAXTIMEOUTS   5  //try 5 times at a given azimuthal spot
//*****************************************************************************

/* Subroutine Declarations */


void SetupTPU(void);

char	offerbootchoice(void);  // for autonomous version, program goes to sample mode
                            // directly, so control c offers choice of DOS or param changes
void	actonbootchoice(void); //present and act upon control c choices
 
void    askparams(void);    // see if user wants to change params, if so, do so

void    readparams(void);   // assign values in param.dat to variables
     
void    listparams();       // list the parameters for the user    
         
bool    chooseandchange();  //have them choose var.# to change and new value
       
bool    checkparams();      // check if all params within spec

void    newparam();  // new var values to newparam.dat, replace param.dat with newparam

void    copyparams(void);   //param.dat copied to param.bak

void	CheckForAcqTime(long int *diffsecs, time_t lasttimet);

ushort  SCIRxFilter_P1(ushort data:__d0):__d0;

void    delay1ms(void); 

void    waitfor881init(int approxsecs);   //delay routine for 881 initialization

void    acqdownimages(void);

void    setsonar(void);                       //   "

void    downping(void);

void    ping(void);                           //   "

int     get_serial_return_data(void);         //   "

int     get_serial_return_tadata(void);         //   "

void    store_serial_return_data(FILE * fpi); //   "

void    store_serial_return_tadata(FILE * fpi); //   "

int		lowerpower(void);  //go into low power mode, to be interrupted with periodic interrupt (PIT)

IEV_C_PROTO(PITHandler);   //interrupt service routine for periodic timer interrupt (PIT)
                           //for low power wake-up, checking time 

void	MakeFileName(char *filename);   //make data file for backscatter file storage (on Flash card)

void	MakeFileName2(char *filename2);  //make file name for 3d mode files (storage on flash card)

void    threedmode();

void    aqutaimages(void);  //talk to and listen to 2 axis pencil beam 881a

void    pingta(void);                           //   "

void    firsttaping(void);   // first ping to set the head to sector start for 3d mode for ea. az 

void    firsttaaz(void);  //send the head to first position for down mode

void    pointdown(void);    //point down, first ping to set the head to 0 degrees

void    set_switches_az(void);  //azimuth switch settings

void    set_switchesfordown(void);  //diff params for downward mode

bool    checkfortimeover(time_t starttime, int downtime);  //see if down mode has gone on for enough time

void	Inithdware(void);  //start with 881 powered off

void    waitmin(int nummin);     

void    averageimages(int numimages); //combine by averaging, images in the image files
     
char *  PDCCopyCmd(CmdInfoPtr cip);

void    set_header_type(void);   //Routines from Doug for 881 communication:

void    set_switches(void);                   //   "

void    send_sw_data(short schannel);

void    write_sw_data(FILE * fpi);            //   "

void    sumtobuff(unsigned int *sumbuffer, unsigned char * databuffer);

void    dividesum(int divn, int * buff, FILE * fpd);  //divide sums by number to avg and write to output file

void    sendfile(char * filetosnd);

//*****************************************************************************

short	CustomSYPCR = WDT419s | HaltMonEnable | BusMonEnable | BMT32;  //required for using the WDT
                      //using 419 second watchdog

TUChParams	IMAGParams;

char	downfile[24], outputfile[24], outputfil2[24];

int      sleepmode;
bool     aok, nodown=FALSE, no3d=FALSE;
bool	 boolval;

char     bootrespons;

FILE		*fp, *fpimg, *fp2;

short	shortpinvar; 
short	shortpinretvar; 

int      clear, threedval;
bool     ctrlc_hit;

int   timeout, minafter, imgstoavg;
int   rangeval, logfval, sgainval, absorptionval;
int   pulselenval, dataptsval;
int   dpulselenval, sendval=0;
int   drangeval, dfreqval, dlogfval, dsgainval, dabsorptionval;
int   i,charsrcvd, pingnumb;

time_t  prevtime, startime;
struct tm *curtime;

int   drangeval,dlogfval,dsgainval,dabsorptionval,dpulselenval;
int   dfreqval,dnew_logf,dnew_absv,dnew_range, dnew_gain, dpulse_length;


char onepingresultbuff[2014];  //for use in averaging routine
int  sumbuff[2014];  //large enough for 500 data point return

CmdInfoPtr  copycip;
int   timeout, minafter;
int   rangeval1, rangeval2, logfval1, logfval2, sgainval1, sgainval2, absorptionval1, absorptionval2; 
int   freqval, sampcount1, sampcount2, samplingloop;
int   pulselenval1, pulselenval2, dataptsval1, dataptsval2;
int   i,charsrcvd, pingnumb;

bool  tatimeoutbreak;
RTCTimer hourglass;
unsigned long new_microsecs;

//*****************************************************************************

    struct	 tm *CurrentTime;
    int      endmin;
    long int to;
    int      secbetwsampling;   //to determine the time to do 3d scan/down scan
    long int secspast, diffseconds;
    int      hourspast, minpast;
    int      hoursincelast=1, secsincelast;
	TUPort	*tuport;
    int      minutesdown;
    double   azinc;  
    int      azimuthdeg;
    unsigned char ser_sw2[64];  
 
 int sec_after, minute_sum;
    
//azimuth variables
int new_azimuth;
short schanneltaaz;
int azimuth_head_pos;
float azimuth_degrees;
short azcounter, sendazctr;   //1 to 120  (180 deg divided by 1.5 degrees is 120 points) 
unsigned char azdig[3], sndazdig[3];

//*****************************************************************************

//881 related variables
//Declarations for sonar switch and return arrays
unsigned char ser_sw[64];
unsigned char ser_ret[SER_RET_SIZE];
unsigned char ser_ret2[SER_RETTA_SIZE];
unsigned char ser_sw3[64];
int     pulse_length = 10;
int     cur_dir;
int     cur_status = 0;
int     cur_range;
int     cur_head_pos;
int     cur_prof_rng;
int     cur_head_id;
int     cur_term_char;
float   cur_angle;
int     port = 1;
int     new_baud   = S115200;
int     new_points = P250; // dataptsval from params can change this, but hdr_type hd wired
int     new_range  = 10;  
int		new_gain   = 20;  
int     new_bits   = 8;
int		new_logf  = 3;  
int		new_absv   = 20; 
int     new_range_os = 0;
int     xdcr_up_down = 1;
int     head_step_dir = 0;
int     master_slave  = 0x43;   //slave
int     hdr_type,nToRead;
char    pbBuf[5000];
int     num_pings, chk, skippings;
int     temp;
short 	angle;
bool    acq, rightaway;

/******************************************************************************\
**	main
\******************************************************************************/

main()

{              /* start of main routine */




	uchar		mirrorpins[] = { 1, 15, 16, 17, 18, 19, 21, 22, 23, 24, 25, 
								26, 27, 28, 29, 30, 31, 32, 33, 34, 0 };



//Putting Necessary Code in Here Little by Little

//	force floating I/O pins to outputs to reduce current
	PIOMirrorList(mirrorpins);

// use the SCI for communication with M.V. Observatory and with
// the outside world.  TPU will be for communicating with the 881a.


	SCIConfigure(38400,'N',TRUE);  	
//	SCIConfigure(38400,'N',TRUE); // 
	SCIRxSetBuffered(true);
//	SCITxSetBuffered(false); // these routines make the serial routines from EEPROM just like those from RAM


    BIOSPatchInsert(SCIRxFilter, SCIRxFilter_P1); 

 //install the periodic interrupt handler address in the PIT vector for use with lowerpower and time checks
    PITSet100usPeriod(PITOff);	// disable timer
    PITRemoveChore(0);			// get rid of all current chores
    IEVInsertCFunct(&PITHandler, pitVector); //install the PIT handler address in the PIT vector slot
    
	// Identify the program and build
	cprintf("\nProgram: %s: %s %s \n", __FILE__, __DATE__, __TIME__);
	cprintf("Ohio State University Two Axis Sonar Image Project\n");  //rcs 4/04
	
	//set up speeds for cf2    

	CSSetSysAccessSpeeds(nsFlashStd, nsRAMStd, nsCFStd, WTMODE);
	
	TMGSetSpeed(SYSCLK);

    cprintf("wait for initial init from turn-on\n");
    waitfor881init(LONGINITWAIT);  //time for 881 initialization and setup	

    Inithdware();  //set the sonar i/o pin to low value i.e. power off to sonar

    //  Set up the 881
   //turn on power to 881
/*  shortpinvar = SONARPOWER;
    shortpinretvar = PIOSet(shortpinvar); //39 set so power on to 881
	
    cprintf("\n\nTurned on power to the 881\n");*/
    
    cprintf("\nHit control C to change parameters or go to DOS\n\n");
    
 //  waitfor881init(LONGINITWAIT);  //time for 881 initialization and setup
//PUT BACK LATER IF NEC    waitfor881init(LONGINITWAIT);  //time for 881 initialization and setup	
   waitfor881init(LONGINITWAIT);  //time for 881 initialization and setup	
    
	//give user choice of DOS or changing params or running program
	
	actonbootchoice();

    readparams();  //this needs to happen before setsonar so that nToRead computed properly
    aok = FALSE;
 
    sleepmode = TRUE;  // start out sleeping till we get to the time for sonar acq

    while(!aok)
    {
      aok = checkparams();   //check for valid parameters
      if(aok==FALSE)
        cprintf("invalid parameter in param.dat.  Hit control C to change parameters\n");
    } 

    
//power out here

    SetupTPU();  //set up cf2 built-in tpu for 881a communications

    rightaway = TRUE;  //overrides start time

    if(threedval==0)
      no3d = TRUE;  
    else
      no3d = FALSE;
      
    if(minutesdown>0)
      nodown = FALSE;
    else
      nodown = TRUE;
	
    setsonar();
    
    cprintf("\n881 was set up \n");

    waitfor881init(SHORTINITWAIT);  //time for 881 initialization and setup  //change 2/04

 
    if (tuport)
       TUClose(tuport);
   
    while(TRUE) // loop to acquire using existing params, can only exit with ctrl c

    {  /* start of the while TRUE loop  */ 



//       curtime=localtime(&prevtime);
//       cprintf("before checkforacq prevtime is %s \n",asctime(curtime));
    
      CheckForAcqTime(&diffseconds, prevtime); //val is returned in diffseconds param

      if(rightaway)
      {
       diffseconds = secbetwsampling;  
       rightaway=FALSE;
      }
              
      if(diffseconds>=secbetwsampling)
      {
      
        acq = TRUE;
        
      //  Set up the 881
      //turn on power to 881
 
        shortpinvar = SONARPOWER;
        shortpinretvar = PIOSet(shortpinvar); //30 set so power on to 881
        cprintf("\n\nTurned on power to the 881\n"); 
        waitfor881init(LONGINITWAIT);  //time for 881 initialization and setup 
 
        SetupTPU();  //set up cf2 built-in tpu for 881a communications

       
        cprintf("starting to sample\n"); 
        if(no3d==FALSE)
           MakeFileName2(outputfil2);  //first 3d file name, will be modified with az info
        else
            cprintf("not doing 3d mode this time\n");
       
        if(no3d==FALSE)             
        {
        
        threedmode();   //do the 3d azimuth/radial mode, multiple files
        
        Inithdware();  //rcs 6/04  turn off 881 power in order to send data, 
                       // will initialize in acqdownimages and before next 3d mode
 
        if(sendval>0)
        {    
            for(sendazctr = 1;sendazctr<=0x4B;sendazctr++)
            {
              sprintf(sndazdig,"%2x",sendazctr);
              if(sendazctr>=0x10)
                 outputfil2[4]=sndazdig[0];
              else
                 outputfil2[4]='0';
              outputfil2[5]=sndazdig[1];
	          cprintf("\n\n*****  SENDING %s  *****\n\n",outputfil2); 
 	          sendfile(outputfil2);  //3d files
 	        }  //end of for loop (up to 0x4B)
 	    } //end of if sendval>0
       if(nodown==TRUE)
       {     
          time(&prevtime);  //get value for checkforacqtime param
          curtime=localtime(&prevtime);
          cprintf("end of down mode %s\n",asctime(curtime));  
       }     
 	    
	        
      } //end of if no3d
        

       if(nodown==FALSE)   //will do some minutes of backscatter profiles, 1 file
       {
	      MakeFileName(downfile);
          acqdownimages();
          if(sendval>0)
	        sendfile(downfile);  //downward mode data
          time(&prevtime);  //get value for checkforacqtime param
          curtime=localtime(&prevtime);
          cprintf("end of down mode %s\n",asctime(curtime));	        
       }
  
       	if (tuport)
         TUClose(tuport);
         

        
      }  //end of if checkforacqtime
    
      else
      {
        if(acq)
        {
           Inithdware();  //sonar power off
           acq = FALSE;
        }
        lowerpower();  //cf2 to lower power and check time at top of this loop when it returns after 10 sec.
        
   
       
      }
    }    /* end of the while TRUE loop */  

	if (tuport)
      TUClose(tuport);
	
   return(0);	
   
}        // end of the main routine //



/******************************************************************************\
**   setsonar        set up the sonar by sending switch data                  **
/*******************************************************************************/

void setsonar(void)
{
//   num_pings = (int)(360/degperstep);
   set_switches();
   send_sw_data(SONARTACHAN);
   
}



/****************************************************************************************\
**	sendfile - send either an averaged or unaveraged image file out the CF2 serial port
\****************************************************************************************/


void    sendfile(char * filetosnd)
{
//open in binary mode
//send each byte out serial port
    int  binchar,tmp;
    long int  charssent;
    FILE * fps;



	SCITxSetBuffered(false);
	SCITxFlush(); 
    
  	if ((fps = fopen(filetosnd, "rb")) == 0)
		{
		cprintf("Couldn't open %s file!\n",filetosnd);
		return;
		}
	else
	{
	    cprintf("Opened the %s file for reading binary and starting to send binary data\n",filetosnd);
	    SCITxFlush();
	    charssent = 0;     //delay scheme so Motocross can keep up
        binchar = fgetc(fps); 
        if(binchar!=EOF)
        {
        do
        {
          charssent++;
      //    if(charssent>48)
      //    {
           for(tmp=0;tmp<40;tmp++)
            delay1ms;  //delay > 40 msec
      //      delay1ms;  //delay 1 msec
      //      delay1ms;  //delay 1 msec
      //    }
          cputc(binchar);
          binchar = fgetc(fps);
    //      if(binchar==(int)'I')
    //        cprintf("\n\ngot an I and chars sent is %ld\n\n",charssent);
        } //end do while binchar not eof
        while(binchar!=EOF);
 //        SCITxFlush();
 	    cprintf("Sent the binary data from %s.\n\n",filetosnd);
 //	    SCITxFlush();
 	    } //end if binchar not eof
 	    fclose(fps);
 	    cprintf("closed %s in sendfile routine\n",filetosnd);         
	} //end else fopen not returning 0 
}

/******************************************************************************/


bool  checkfortimeover(time_t starttime, int downtime)  //see if down mode has gone on for enough minutes
{
     time_t t;
     double doubledown;
   
     t = time(&t);                 // get the current time
     doubledown = (double)downtime;  //time to do down mode in minutes, convert to double
     if(difftime(t,starttime)>=doubledown*60.0)
       return(TRUE);
     else
       return(FALSE);
}

         
/******************************************************************************\
**	waitmin 
**	
**	code from testeddy to use to wait a minute using RTC 
**		
**	3/30/01
**	
\******************************************************************************/

void waitmin(int nummin)
{
  int    yet;
  char   second[2],minute[3];
  char   *timeptr;
  struct tm *curtime;
  time_t bintime;
  int    nowmin,nowsec,pastsec,pastmin;


  time(&bintime);   /* time in seconds since midnite 1/1/70 GMT */
  curtime=localtime(&bintime);     /* convert to local time */
  timeptr = 11+(asctime(curtime)); /* assign ptr to pt at hour */
  strncpy(minute,timeptr+3,2);
  strncpy(second,timeptr+6,2);
  nowmin=atoi(minute);
  nowsec = atoi(second);
  pastsec = nowsec;
  pastmin = nowmin;
  yet = FALSE;
  while(!yet)
  {
    time(&bintime);   /* time in seconds since midnite 1/1/70 GMT */
    curtime=localtime(&bintime);     /* convert to local time */
    timeptr = 11+(asctime(curtime)); /* assign ptr to pt at hour */
    strncpy(minute,timeptr+3,2);
    strncpy(second,timeptr+6,2);
    nowmin=atoi(minute);
    nowsec = atoi(second);

    if(((nowmin<nummin)&&((nowmin+60-pastmin)==nummin)&&(nowsec >= pastsec))||((nowmin-pastmin)==nummin)&&(nowsec >= pastsec))
	  yet = TRUE;   /* nummin minutes has passed */
  }
}



/******************************************************************************
*
*    set_switches  (was set_switches2 in Peter's bathym code)
*    derived from Doug Wilson's TT8 code (run2001.c)
*
******************************************************************************/


void set_switches(void)
{

	set_header_type();

	/* 360 Deg = 120, 180 Deg = 60, 90 Deg = 30, 45 Deg = 15 */
//	sect_size = new_sector/3;
//    train_ang = (new_train+210)/3;
//    cprintf("set switches routine\n");
    
	ser_sw2[0] = 0xFE;
	ser_sw2[1] = 0x44;
	ser_sw2[H_ID] = 0x10;     
	ser_sw2[RNG] = new_range;      /* 5 - 250 M, 5 M  inc  */
	ser_sw2[RNG_OSET] = 0;           /* 0 - 250 M, 1 M inc   */
	ser_sw2[HOLD] = 0;
	ser_sw2[MA_SL] = master_slave;   /* Bit 6 -> 0 = Master, 1 = Slave  */
					/* Bit 1 -> 1 = Send Data          */
					/* Bit 0 -> 1 = Xmit               */
	ser_sw2[R_HSTAT] = 0;
	ser_sw2[S_GAIN] = new_gain;      /* (0 to 80dB) start gain @ 100 mmS */
	ser_sw2[LOGF] = new_logf;        /* logval/10 - 1 --> 0,1,2,3 --> 10,20,30,40dB */
	ser_sw2[ABSV] = new_absv;
	ser_sw2[TRAIN] = 60;      /* 60 is 0 degrees       */
	ser_sw2[SECTW]  = 60;     /* 180 deg     */
//	cprintf("setting ser_sw2 SECTW to %d\n", sect_size2);
    ser_sw2[STEP] = 4; // hardwired, see num_pings, and STEP in pingta
	ser_sw2[PLEN] = pulse_length;
	ser_sw2[LPF] = 0;
	ser_sw2[ST_SCAN] = 0;
	ser_sw2[MOVE_REL] = 0;
	ser_sw2[NSWEEPS] = 0;
	if(hdr_type==0x4D) ser_sw2[NDPOINTS] = 25; /* 25,50,200 --> 250,500,2000         */
	if(hdr_type==0x47) ser_sw2[NDPOINTS] = 50;
//	if(hdr_type==0x51) ser_sw[NDPOINTS] = 200;
	ser_sw2[NDBITS] = 8;       /* 4 -->  Data = 1 Byte, 2 Data Points/Byte    */
					 /* 8 -->  Data = 1 Byte, 1 Data Point/Byte     */
					 /* 16 --> Data = 2 Bytes, 1 Data Point/2 Bytes */
					 /*       Always 250 Data Points                */
	ser_sw2[UP_BAUD] = new_baud;      /* 0x06 = 115200 */
	if(hdr_type==0x50) ser_sw[PROFSW] = ON;
	else ser_sw[PROFSW] = OFF;
	ser_sw2[CALIB] = OFF;

    ser_sw2[SW_DELAY] = 1;   // switch delay 
//    ser_sw[SW_DELAY] = 0x60;     /* need switch delay in master mode - 192 msec - this value works 9/26/01 */ 
	ser_sw2[FREQUENCY] = freqval;
	ser_sw2[TERM] = 0xFD;
									/* use 253 for last value */

	/****** UP_BAUD Values *********
			9600            - 0x0B
			14400           - 0x03
			19200           - 0x0C
			28800           - 0x04
			38400           - 0x02
			57600           - 0x05
			115200          - 0x06
	*******************************/
}


/******************************************************************************
*
*    set_switches  (was set_switches2 in Peter's bathym code)
*    derived from Doug Wilson's TT8 code (run2001.c)
*
******************************************************************************/


void set_switchesfordown(void)
{

	set_header_type();

	/* 360 Deg = 120, 180 Deg = 60, 90 Deg = 30, 45 Deg = 15 */
//	sect_size = new_sector/3;
//    train_ang = (new_train+210)/3;
//    cprintf("set switches routine\n");
    
	ser_sw2[0] = 0xFE;
	ser_sw2[1] = 0x44;
	ser_sw2[H_ID] = 0x10;     
	ser_sw2[RNG] = dnew_range;      /* 5 - 250 M, 5 M  inc  */
	ser_sw2[RNG_OSET] = 0;           /* 0 - 250 M, 1 M inc   */
	ser_sw2[HOLD] = 0;
	ser_sw2[MA_SL] = master_slave;   /* Bit 6 -> 0 = Master, 1 = Slave  */
					/* Bit 1 -> 1 = Send Data          */
					/* Bit 0 -> 1 = Xmit               */
	ser_sw2[R_HSTAT] = 0;
	ser_sw2[S_GAIN] = dnew_gain;      /* (0 to 80dB) start gain @ 100 mmS */
	ser_sw2[LOGF] = dnew_logf;     //down value
	ser_sw2[ABSV] = dnew_absv;
	ser_sw2[TRAIN] = 60;      /* 60 is 0 degrees       */
	ser_sw2[SECTW]  = 60;     /* 180 deg     */
//	cprintf("setting ser_sw2 SECTW to %d\n", sect_size2);
    ser_sw2[STEP] = 4; // hardwired, see num_pings, and STEP in pingta
	ser_sw2[PLEN] = dpulse_length;
	ser_sw2[LPF] = 0;
	ser_sw2[ST_SCAN] = 0;
	ser_sw2[MOVE_REL] = 0;
	ser_sw2[NSWEEPS] = 0;
	if(hdr_type==0x4D) ser_sw2[NDPOINTS] = 25; /* 25,50,200 --> 250,500,2000         */
	if(hdr_type==0x47) ser_sw2[NDPOINTS] = 50;
//	if(hdr_type==0x51) ser_sw[NDPOINTS] = 200;
	ser_sw2[NDBITS] = 8;       /* 4 -->  Data = 1 Byte, 2 Data Points/Byte    */
					 /* 8 -->  Data = 1 Byte, 1 Data Point/Byte     */
					 /* 16 --> Data = 2 Bytes, 1 Data Point/2 Bytes */
					 /*       Always 250 Data Points                */
	ser_sw2[UP_BAUD] = new_baud;      /* 0x06 = 115200 */
	if(hdr_type==0x50) ser_sw[PROFSW] = ON;
	else ser_sw[PROFSW] = OFF;
	ser_sw2[CALIB] = OFF;

    ser_sw2[SW_DELAY] = 1;   // switch delay 
//    ser_sw[SW_DELAY] = 0x60;     /* need switch delay in master mode - 192 msec - this value works 9/26/01 */ 
	ser_sw2[FREQUENCY] = dfreqval;
	ser_sw2[TERM] = 0xFD;
									/* use 253 for last value */

	/****** UP_BAUD Values *********
			9600            - 0x0B
			14400           - 0x03
			19200           - 0x0C
			28800           - 0x04
			38400           - 0x02
			57600           - 0x05
			115200          - 0x06
	*******************************/
}

/******************************************************************************
*
*    set_header_type
*    subroutine for set_switches
*    from Doug Wilson's TT8 code (run2001.c)
*
******************************************************************************/

void set_header_type(void)
{
    /*  'M' = 0x4D */
    /*  'G' = 0x47 */
    /*  'P' = 0x50 */
    /*  'Q' = 0x51 */

    switch(new_points) {
       case P250:    hdr_type = 0x4D;   /* 'M' - 250 points */
			break;
       case P500:       hdr_type = 0x47;        /* 'G' - 500 points */
			break;

       case PROFILE:    hdr_type = 0x50;        /* 'P' - 0 points */
			break;
 
       }


//change 2/04 hard-wire header type
    hdr_type = 0x4d;  //to go with 250 points  

       

//  rcs comment: 12 is for 12 byte header, middle number for data bytes, 1 for FC (termination byte)
    switch(hdr_type) {
	case 0x4D:      nToRead = 12+252+1;     /*  265 Bytes */
//			nToReadIndex = 2;
			break;
	case 0x47:      nToRead = 12+500+1;     /*  513 Bytes */                                
//	        nToReadIndex = 3;
			break;
	case 0x50:      nToRead = 12+1;         /*   13 Bytes */
//			nToReadIndex = 0;
			break;
	case 0x51:
	    if(new_bits == 8)
	    {
	    switch(new_range) {
		   case 5:
		     nToRead = 12+500+1;        /*  513 Bytes */
//		     nToReadIndex = 3;
		     break;

		   case 10:
		     nToRead = 12+1000+1;       /* 1013 Bytes */
//		     nToReadIndex = 5;
		     break;

		   case 15:
		     nToRead = 12+1500+1;       /* 1513 Bytes */
//		     nToReadIndex = 6;
		     break;

		   default:
		     nToRead = 12+2000+1;       /* 2013 Bytes */
//		     nToReadIndex = 7;
		     break;
		}
	    }
	    else
		{
		switch(new_range) {
		case 5:
		     nToRead = 12+1000+1;        /*  513 Bytes */
//		     nToReadIndex = 5;
		     break;

		   case 10:
		     nToRead = 12+2000+1;       /* 1013 Bytes */
//		     nToReadIndex = 7;
		     break;

		   case 15:
		     nToRead = 12+3000+1;       /* 1513 Bytes */
//		     nToReadIndex = 8;
		     break;

		   default:
			 nToRead = 12+4000+1;   /* 2013 2byte points */
//			 nToReadIndex = 9;
			 break;
			 }
		}

	}
}


/******************************************************************************
*
*    send_sw_data
*    derived from Doug Wilson's TT8 code (run2001.c)
*
******************************************************************************/

void send_sw_data(short schannel)
{
//   char ch;
//   short ch_ctr,status;
   short ch_ctr;
//   unsigned short Stat,nbytes;
   unsigned short nbytes;
//   char *lpWritePtr;
   register int ctr;
   
   
// switch to tpu   U4SFlush(schannel);  //get ready to send chars out the U4S port
//   cprintf("sending the switch data out the tpu port in send_sw_data\n");

    
//   shortpinvar = COMDIRECTION;
//   shortpinretvar = PIOSet(shortpinvar); //30 set so transmitting (485) to 881
   
   ch_ctr = 0;

   nbytes = 29;
   ctr = 0;


    if(schannel==SONARTACHAN)

     do{
// switched to tpu	U4STxPutChar(schannel,(int)ser_sw2[ctr]);
//	 tputc(tuport,(ser_sw2[ctr]));
	//  TUTxPutByte(tuport,(ushort)(ser_sw2[ctr]),TRUE);
	
	

	
        TUTxFlush(tuport);
	
        TUTxPutByte(tuport,(ushort)(ser_sw2[ctr]),TRUE);

	
	/*	TUTxPutByte(tuport,'A',true);
		TUTxPutByte(tuport,'B',true);
		TUTxPutByte(tuport,'C',true);
		TUTxPutByte(tuport,'D',true);
		TUTxPutByte(tuport,'E',true);
		TUTxPutByte(tuport,'F',true);*/

		TUTxWaitCompletion(tuport);

		RTCDelayMicroSeconds(100L);
		
	// TUTxPrintf(tuport,"*00P\r\n");
	 
//	 TUTxPutByte(tuport,(ushort)'c',TRUE);
	 
//	 cprintf("sent a %x \n",(int)ser_sw2[ctr]);	
	 ctr++;
     }while(ser_sw2[(ctr-1)] != 0xFD & ctr < nbytes);


//   boolval = FALSE;
//   while(boolval == FALSE)
// switch to tpu      boolval = U4STxComplete(schannel);


    if(schannel==SONARTAAZCHAN)  //if azimuth drive communication
    {
       schanneltaaz = SONARTACHAN;  //use same two axis sonar u4s channel

     do{
 
// switched to tpu     	U4STxPutChar(schanneltaaz,(int)ser_sw3[ctr]);  //but use 3rd serial switch buffer
    //    cprintf("sent a %x\n",(int)ser_sw3[ctr]);	

//	 tputc(tuport,(ser_sw3[ctr]));
	 TUTxPutByte(tuport,(ushort)(ser_sw3[ctr]),TRUE);
//     cprintf("sent a %x \n",(int)ser_sw3[ctr]);	

	 ctr++;
     }while(ser_sw3[(ctr-1)] != 0xFD & ctr < nbytes);


//   boolval = FALSE;
//   while(boolval == FALSE)
// switch to tpu      boolval = U4STxComplete(schanneltaaz);
      ;

   }
}


/******************************************************************************
*
*    write_sw_data
*    write the same switch data sent to 881, to the file for reference
*
******************************************************************************/

void write_sw_data(FILE * fpi)
{
//   char ch;
//   short ch_ctr,status;
   short ch_ctr;
//   unsigned short Stat,nbytes;
   unsigned short nbytes;
//   char *lpWritePtr;
   register int ctr;
   
   

//   cprintf("sending the switch data out the u4s port 1\n");
   
   ch_ctr = 0;

   nbytes = 29;
   ctr = 0;
//   for(i=0;i<29;i++){      commented out by phil or doug
     do{
      //  printf("\nser_sw[%d] %x",ctr,ser_sw[ctr]);  // TEMPORARILY BACK commented out by phil or doug

// RCS commented out This line till we replace with cf1 routine:	TSerPutByte(outchan,ser_sw[ctr]);
	 fputc((int)ser_sw[ctr],fpi); 

	 ctr++;
//        DelayMilliSecs(1);     commented out by phil or doug
     }while(ser_sw[(ctr-1)] != 0xFD & ctr < nbytes);

}


/******************************************************************************\
**  void downPing(void)                 
**  this subroutine commands the sonar to ping for downward mode
\******************************************************************************/

void downping(void)
{
 
   ser_sw2[MA_SL] = 0x43;  //rcs comment:  this says send data in slave mode   
   ser_sw2[TRAIN] = 60;    /* center scan on 0 degrees - rcs  */
   ser_sw2[SECTW] = 0;   /* 0 degree scan for downward mode - rcs  */
   ser_sw2[STEP] = 0;   /* 0 step size for downward mode - rcs   */
   ser_sw2[PLEN] = pulse_length; /* restore this */
   send_sw_data(SONARTACHAN);
}


 /******************************************************************************\
**
**  void firsttaping(void)                 
**  this subroutine commands the pencil beam sonar to ping in order to set the 
**  train angle to 90 (for 3d mode)
**
\******************************************************************************/

void firsttaping(void)  //send the head to first position for two axis pencil beam
{

   ser_sw2[MA_SL] = 0x43;  //rcs comment:  this says send data in master/slave byte (6)
   //start at center of scan minus half the sector width
   ser_sw2[TRAIN]=90;  // 90 degrees  
   ser_sw2[SECTW] = 0;     /* a scan of 0 degrees for now - rcs - so head moves to sector start */
   send_sw_data(SONARTACHAN);

}  


 /******************************************************************************\
**
**  void firsttaaz(void)                 
**  this subroutine commands the pencil beam sonar to ping in order to set the 
**  train angle to 90 (for downmode)
**
\******************************************************************************/

void firsttaaz(void)  //send the head to first position for down mode
{


	ser_sw3[0]  = 0xFE;
	ser_sw3[1]  = 0x44;
	ser_sw3[2]  = 0x1F;		/* Head ID for Azimuth Drive is 0x1F */
	ser_sw3[3]  = 0;
	ser_sw3[4]  = 0;
	ser_sw3[5]  = 0;
	ser_sw3[6]  = 0x43;		/* Slave Mode */
	ser_sw3[7]  = 0;
	ser_sw3[8]  = 0;
	ser_sw3[9]  = 0;
	ser_sw3[10] = 0;
	ser_sw3[11] = (900 & 0x7F);       //go to 90 degrees i.e. down
	ser_sw3[12] = (900 & 0x3F80)>>7;
	ser_sw3[13] = 0;
	ser_sw3[14] = 0;
	ser_sw3[15] = 0;
	ser_sw3[16] = 0;
	ser_sw3[17] = 0;
	ser_sw3[18] = 0;
	ser_sw3[19] = 0;
	ser_sw3[20] = 0;
	ser_sw3[21] = 0x06;		/* Up Baud, 0x06 = 115200bps */
	ser_sw3[22] = 0;
	ser_sw3[23] = 0;
	ser_sw3[24] = 0;    		/* Switch Delay, 2ms increments */
	ser_sw3[25] = 0;
	ser_sw3[26] = 0xFD;		/* Termination Character */
    send_sw_data(SONARTAAZCHAN);

      send_sw_data(SONARTAAZCHAN);  //send ser_sw3 array to two axis sonar azimuth drive
      
        
	  get_serial_return_tadata(); 

	     
	  azimuth_head_pos =  ((ser_ret2[6])<<7) | (ser_ret2[5]);
	  azimuth_degrees = (azimuth_head_pos-600) * 0.3;
	  printf("Azimuth: %x %x %d (%05.1f Deg)\n",ser_ret2[5], ser_ret2[6], azimuth_head_pos,azimuth_degrees);	

	return;
}





/******************************************************************************\
**  void Pingta(void)                 
**  this subroutine commands the 2 axis pencil beam sonar to ping (for 3d mode)
\******************************************************************************/

void pingta(void)
{

//   cprintf("in pingta\n");

   ser_sw2[MA_SL] = 0x43;  //rcs comment:  this says send data in slave mode   
   ser_sw2[TRAIN] = 60; /* hard wire to 0 deg train ang - rcs  */
   ser_sw2[STEP] = 4;  /* hard wire to 1.2 deg per step */   
   ser_sw2[SECTW] = 60; /* hard wire to 180 width */
   ser_sw2[PLEN] = pulse_length; /* restore this  */
   send_sw_data(SONARTACHAN);
}
/******************************************************************************\
**  get_serial_return_data               
\******************************************************************************/

int get_serial_return_data(void)
	{

	int ch, numchars;


	long ctr_max,ctr;

	ctr = 0;
	
	ctr_max = SER_RET_SIZE;
	
	ch = 0;

    to = 0;  //timeout variable, incremented in PIT

    PITSet100usPeriod(PIT40Hz);		// start the engine for sonar timeout

    do{
    
    
    		numchars = TURxQueuedCount(tuport);
			if(numchars > 0)
			{
				to = 0;  //reset timeout each time a char comes in

				ch=TURxGetByte(tuport,false);
			    ser_ret[ctr] = (unsigned char) ch;
				
                if(ch==0x00FC)
	              break;
         		ctr++; 					
			}
	}     
    while((ctr<ctr_max)&&(to < SONARTIMEOUT));
            
    PITSet100usPeriod(PITOff);	// stop PIT

    if(to >= SONARTIMEOUT)
    {
    //   tatimeoutbreak = TRUE;
       to = 0;  	
       cprintf("2 axis pencil beam sonar not responding in down mode, timeout occurred\n");
       return(0);
    }
       

             
	return(1);
}

/******************************************************************************\
**  get_serial_return_ta_data               
\******************************************************************************/

int get_serial_return_tadata(void)
	{

	int ch, numchars;


	long ctr_max,ctr;



 //   cprintf("in get serial return ta routine\n");
    
	ctr = 0;
	
	ctr_max = SER_RETTA_SIZE;
	
	ch = 0;

    to = 0;   //timeout variable, incremented in PIT
    
    PITSet100usPeriod(PIT40Hz);		// start the engine for sonar timeout

    do{
    
 
 	    numchars = TURxQueuedCount(tuport);
		if(numchars > 0)
			{
		      to = 0;  //reset timeout each time a char comes in
			  ch = TURxGetByte(tuport,FALSE);
			  ser_ret2[ctr] = (unsigned char) ch;
		//	  cprintf("%c ",(unsigned char)ch);
		//      putchar(ch);
		      if(ch==0x00FC)
                break;
		      ctr++;
			}   
 /* switched to tpu      if(U4SRxCharsAvail(SONARTACHAN)>0)
       {
        to = 0;  //reset timeout each time a char comes in
        ch = U4SRxGetChar(SONARTACHAN);                      
		ser_ret2[ctr] = (char) ch;
	//	cprintf("received a char\n");
		if(ch==0x00FC)
		{
		  break;
		}
		
		ctr++;
       }*/
              
	 }
	 while((ctr<ctr_max)&&(to < SONARTIMEOUT));
	
  	PITSet100usPeriod(PITOff);	// stop PIT

    if(to >= SONARTIMEOUT)
    {
       tatimeoutbreak = TRUE;
       cprintf("2 axis pencil beam sonar not responding, timeout occurred\n");
       return(0);
    }
       
    to = 0;  	
	

	return(1);
}


/******************************************************************************\
**     store_serial_returnta_data                                                             
\******************************************************************************/


void store_serial_return_tadata(FILE * fpi)
{

     fwrite(ser_ret2,1,nToRead,fpi);

}

/******************************************************************************\
**     store_serial_return_data                                                             
\******************************************************************************/


void store_serial_return_data(FILE * fpi)
{

     fwrite(ser_ret,1,nToRead,fpi);

}

/******************************************************************************\
**	PITHandler		
**	
**  This interrupt is used to wake up at the PIT rate from the low power mode
**  to check if it is the time of the hour for the image acquisition.
**
\******************************************************************************/
IEV_C_FUNCT(PITHandler)	// implied (IEVStack *ievstack:__a0) parameter
	{
	#pragma unused(ievstack)

//	if (clear == FALSE)
//	{
//	    PinClear(25); 
	    to++;
//	    clear = TRUE;
/*	}
    else
    {
//	    PinSet(25);
	    to++; 
	    clear = FALSE;
//	    cprintf("%ld ",to);
	}*/

	}	//____ ADTimingRuptHandler() ____//


/******************************************************************************/
//   threedmode is 3D mode using azimuth and scanning to do 3D sonar
/*****************************************************************************/

    void  threedmode()  
    {

    int timedoutct = 0;
    bool samefile=FALSE;
    
    azcounter = 0;
	new_azimuth = 600;	/* 0 degrees for azimuth drive */
      
    while(new_azimuth < 1200)  //this brings it to 180 degrees (from the start at 600)
    {  //start of pencil beam 2 axis 881a loop
    
      if(samefile==FALSE)
      {
        azcounter++;
        sprintf(azdig,"%2x",azcounter);
        if(azcounter>=0x10)
          outputfil2[4]=azdig[0];
        else
          outputfil2[4]='0';   //put the count in the file name
        outputfil2[5]=azdig[1];
      }
      else
        samefile=FALSE;  //for next attempt

   	  if ((fp2 = fopen(outputfil2, "wb")) == 0)  //rcs 9/25/03 no need to append here, will only open once
	 	{
	  	  cprintf("Couldn't open %s, the 2 axis sonar 881a pencil beam output file!\n",outputfil2);
		  return;
		}
	  else
	  {
	    cprintf("Opened the %s file for fp2\n",outputfil2);
        write_sw_data(fp2);  //switch data to S1 storage file for 2 axis pencil beam
        fprintf(fp2,"The file name is %s\n",outputfil2);
	  }
    
       set_switches();    //set up for 2 axis pencil beam

   //    cprintf("set switches\n");
    
       tatimeoutbreak = FALSE; 
    
        aqutaimages();  //2 axis pencil beam images to image files
        if((tatimeoutbreak)&&(timedoutct<MAXTIMEOUTS))
        {
           timedoutct++;
           cprintf("Timed out %d times\n",timedoutct);
           samefile = TRUE;
        }
        
        else
        {
           timedoutct=0;
	       new_azimuth+=8;		/* increment azimuth by 2.4 degrees */
	    }
       TickleSWSR();
      set_switches_az();
      
  //    cprintf("set switches az\n");
      
      send_sw_data(SONARTAAZCHAN);  //send ser_sw3 array to two axis sonar azimuth drive
 
//      cprintf("sent switch data az\n");
     
	  get_serial_return_tadata();    
	  
//	  cprintf("got serial return ta data\n");
	      
      set_switches_az();

//      cprintf("set switches az again\n");
      
      send_sw_data(SONARTAAZCHAN);  //send ser_sw3 array to two axis sonar azimuth drive
      
 //     cprintf("sent switch data az again\n");
        
	  get_serial_return_tadata(); 

//	  cprintf("got serial return ta data again\n");
	     
	  azimuth_head_pos =  ((ser_ret2[6])<<7) | (ser_ret2[5]);
	  azimuth_degrees = (azimuth_head_pos-600) * 0.3;
	  printf("Azimuth: %x %x %d (%05.1f Deg)\n",ser_ret2[5], ser_ret2[6], azimuth_head_pos,azimuth_degrees);
	
    }  // end of pencil beam loop (i.e. new_azimuth > 1200 
    
    fflush(fp2);  
    fclose(fp2);  //close TA storage file
  }


/******************************************************************************\

**	inithdware

\******************************************************************************/



void	Inithdware(void)

{

	short shortpinlevvar;

	short shortpin;

	

	shortpinlevvar = 0;

    cprintf("\nInitializing Hardware\n");

    shortpin = SONARPOWER;

	shortpinlevvar = PIOClear(shortpin);
	
	cprintf("power off to sonar");
	
    waitfor881init(LONGINITWAIT);  //need to have it off for longish time or sonar has problems	*/
	

}

/******************************************************************************\
**	lowerpower
\******************************************************************************/

	
int lowerpower(void)  //goes into lower power mode with LPStopCSE and comes back when PIT interrupts 
                      //and increments counter 
{
    unsigned int counter;

 
   //printf("entered lower power\n");
      
    execstr("time");
    
//    cprintf("\n");
    
	CTMRun(false);				// turn off CTM6 module

	SCITxWaitCompletion();		// let any pending UART data finish
	
	SCIRxFlush();               // Flush the receive buffer of the UART
	
	EIAForceOff(true);			// turn off the RS232 driver

    counter = 0;


 	PITSet100usPeriod(PIT40Hz);		// start the engine ...	


	while (counter++ < 40 * 10 ) // off for 10 sec and then in main check if time to wake up
                                 // (change the 10 to 60 for one minute)
		{

         LPStopCSE(FastStop);	// --jhg2000/06/15

		}

      
 	CTMRun(true);				// turn on CTM6 module

    EIAForceOff(false);			// turn the RS232 driver back on

  	PITSet100usPeriod(PITOff);	// stop PIT
  	
  
	
	return 0;


	}	//____ lowerpower ____//


/******************************************************************************\
**  SCIRxFilter_P1  ....   patch for scirxfilter                                **
\******************************************************************************/

 ushort SCIRxFilter_P1(ushort data:__d0):__d0
 {
    if(data == 0x03)
    {
	  ctrlc_hit = TRUE;
//	  cprintf("cc\n");
	}
    return data;
 }


/******************************************************************************\
**
**   acqdownimages          acquire binary data from 881
**
\******************************************************************************/

     void   acqdownimages(void)
     {
          
 
     //   long int ii;
        bool done;
	    struct tm *curtime;
        time_t bintime;
        
        
        cprintf("reinitialize the sonar (for the downward image) \n");

       
      //turn on power to 881
       shortpinvar = SONARPOWER;
       shortpinretvar = PIOSet(shortpinvar); //30 set so power on to 881
	
        waitfor881init(LONGINITWAIT);  //time for 881 initialization and setup	*/
 
  //       cprintf("point the sonar to 90 degrees (downward) \n");
 
 //       firsttaaz();
 
 //       waitfor881init(SHORTINITWAIT);  //time for 881 initialization and setup	
              
        done = FALSE;

            
            if ((fpimg = fopen(downfile, "wb")) == 0)  
		    {
		      cprintf("Couldn't open %s\n", downfile);
		      return;
		    }
		    else
		      cprintf("opened %s\n", downfile);            
            
		    pingnumb = 0;

    //write time to file
       time(&startime);   /* will be used to write and to time down mode */
       curtime=localtime(&startime);     /* convert to local time */

       fprintf(fpimg,"%s\n",asctime(curtime));
       cprintf("beginning down mode at %s\n",asctime(curtime));

        RTCElapsedTimerSetup(&hourglass);  //set up time stamp 

        while(done == FALSE)
        {
      //     for(ii=0;ii<numdownpings;ii++)
      //     {
              pingnumb++;

		      new_microsecs = RTCElapsedTime(&hourglass);
		      fprintf(fpimg, "\n%12lu   ",new_microsecs);

              downping();
	          chk = get_serial_return_data();
	
	    
	          if(chk)
	          {
                store_serial_return_data(fpimg);  
	          }
	          
	          else
	             cprintf("aqudownimages - did not receive serial return data\n");

              done = checkfortimeover(startime,minutesdown);  //see if we're at the end if the down mode sample time
	            
	              
	       }  
       time(&bintime);   /* time in seconds since midnite 1/1/70 GMT */
       curtime=localtime(&bintime);     /* convert to local time */
       fprintf(fpimg,"%s\n",asctime(curtime));
       cprintf("%s\n",asctime(curtime));	         
		   cprintf("did %d pings\n", pingnumb); 
          
         fflush(fpimg);  //close image file
         fclose(fpimg);

         cprintf("closed the %s file\n",downfile);
   } 
      
/******************************************************************************\
**  waitfor881int - delay routine                                             **
\******************************************************************************/

 void waitfor881init(int approxsecs)
 {
    for(i=1;i<=approxsecs;i++) //wait > approxsecs seconds - allow commun with 881 & 881 initialization 
    {
       Delay1ms();
       if(ctrlc_hit==TRUE)
          break;
    }
 }


/******************************************************************************\
**  actonbootchoice - present ctrl c offer choices and act on them             **
\******************************************************************************/

void actonbootchoice(void)
{
  
  
         if(ctrlc_hit==TRUE)
         {
           ctrlc_hit = FALSE;
           bootrespons = offerbootchoice();
           cprintf("the response was %c\n",bootrespons);
           if (bootrespons == '1')
              BIOSResetToPicoDOS();
           else if (bootrespons == '2')
           {
              askparams();
              BIOSReset();
           }
           else
           {
            //  VEEstore_params();
              BIOSReset();
           }
        }
}


/******************************************************************************\
**  offerbootchoice - after ctrl c offer choices                                **
\******************************************************************************/

 char offerbootchoice(void)
 {
 
 
      char bchoice;
      
      SCIRxFlush(); 
      SCITxFlush();
 
      cprintf("Please choose an option:   \n\n");
 
      cprintf("1)  Return to DOS\n");
           
      cprintf("2)  Review or change parameter values and restart\n");
      
      cprintf("3)  Restart in sampling mode\n\n");
      
      cprintf("Please enter the number     ");
         
      bchoice = getch();
      
      cprintf("%c\n",bchoice);   //echo the character
      
      return(bchoice);
 }
 
 
 /******************************************************************************\
**   askparams        let user change parameters                              **
\******************************************************************************/

void    askparams(void)
{

      char  cc;
      bool  loopagain,done;

      copyparams();   //copy param.dat into param.bak
      readparams(); 
      cprintf("Do you want to change any parameters ?  (y/n)   ");
      cc = getch();
      cprintf("%c\n",cc);   //echo the character
      if((cc=='n') || (cc=='N'))
      {
         aok = checkparams();
         if(aok==FALSE)
            cc='y';  //they have to change params if out of range value
      }
      if ((cc=='y') || (cc=='Y'))  //user wants to change params
      {  //(1)
      
          loopagain = TRUE;
          while(loopagain)
          {
             listparams();
             done = chooseandchange();
             aok = checkparams();
             if((aok)&&(done))
                loopagain = FALSE;
          }
         
          newparam();  //replace param.dat with new variables
          
      }
}      


/******************************************************************************\
**  copyparams        param.dat to param.bak                                  **
\******************************************************************************/

void  copyparams(void)
{
	  execstr("del param.bak");
	  execstr("copy param.dat param.bak");
}


void readparams(void)   // assign values in param.dat to variables
{
      FILE *fpp;
      char  paramline[80];
      int   retval,n;
      char  cc, *result;
      bool  openedok,copyifposs;


            copyifposs = FALSE;
            if ((fpp = fopen("param.dat", "r")) == 0)   //open the parameter file
		    {
		  //      cprintf("Couldn't open param.dat file!  Trying VEEProm values instead.\n");
		        cprintf("Couldn't open param.dat file!\n");
		        if ((fpp = fopen("param.bak", "r")) == 0)   //open the backup parameter file
		        {
		           openedok = FALSE;
		           cprintf("Couldn't open param.bak file!\n");
		        }
		        else
		        {
		           openedok = TRUE;
		           copyifposs = TRUE;
		        }
		    }
		    else
		      openedok = TRUE;
	       //parameter file was opened         
	        if(openedok)
	        {
	          retval = 1;
	          n=0;
	          cprintf("Copying parameters from param file!\n");
	          while(retval!=EOF)
	          {       
	             retval = fscanf(fpp,"%s",paramline);  //get params from param.dat
	         //    cprintf("%s",paramline);
	             if(retval==EOF)
	               break;
	        //     cprintf("%s",paramline);    //debug
	             cc = '=';
	             if((result = strchr(paramline,cc)) != NULL) //if an equal sign there
	             {
	                n++;
	          //      cprintf("\n%d)  ",n);  //then cr lf there too, convert number
	                switch(n)
                    {
                      case 1:
                         minafter = atoi(result+1);
                         cprintf("\nstart time (minutes after the hour) is %d\n",minafter); 
                         break;
                      case 2:
                         imgstoavg = atoi(result+1);
                         cprintf("(not implemented!) 2 axis pencil beam images to average is %d\n",imgstoavg); 
                         break;
                      case 3: 
                         secbetwsampling = atoi(result+1);
                         cprintf("seconds between samples is %d\n",secbetwsampling);
                         break;
                      case 4: 
                         minutesdown = atoi(result+1);
                         cprintf("minutes to run downward scan is %d\n",minutesdown);
                         break;
                      case 5: 
                         azinc = atof(result+1);
                         printf("degrees of azimuth increment are %lf\n",azinc);
                         break;                                                 
                      case 6:
                         rangeval = atoi(result+1);
                         cprintf("2 axis pencil beam range value is %d\n",rangeval);
                         break;
                      case 7:
                         freqval = atoi(result+1);
                         cprintf("2 axis freq value is %d\n", freqval);
                         break;
                      case 8:
                         logfval = atoi(result+1);
                         cprintf("2 axis pencil beam logf value is %d\n",logfval);
                         break;
                      case 9:
                         sgainval = atoi(result+1);
                         cprintf("2 axis pencil beam start gain value is %d\n",sgainval);
                         break; 
                      case 10:
                         absorptionval = atoi(result+1);
                         cprintf("2 axis pencil beam (881a) absorption value is %d\n",absorptionval);
                         break; 
                      case 11:
                         pulselenval = atoi(result+1);
                         cprintf("2 axis pencil beam pulse length value is %d\n",pulselenval); 
                         break;
                      case 12:
                         threedval = atoi(result+1);
                         if(threedval==0)
                           cprintf("we will not use 3d mode.\n");
                         else
                           cprintf("we will use 3d mode.\n");
                         break;
                      case 13:
                         sendval = atoi(result+1);
                         if(sendval==0)
                            cprintf("do not send the data\n");
                         if(sendval==1)
                            cprintf("send the data serially after acquiring\n");
                         break;
                      case 14:
                         drangeval = atoi(result+1);
                         cprintf("downward range value is %d\n",drangeval);
                         break;
                      case 15:
                         dfreqval = atoi(result+1);
                         cprintf("downward freq value is %d\n", dfreqval);
                         break;
                      case 16:
                         dlogfval = atoi(result+1);
                         cprintf("downward logf value is %d\n",dlogfval);
                         break;
                      case 17:
                         dsgainval = atoi(result+1);
                         cprintf("downward start gain value is %d\n",dsgainval);
                         break; 
                      case 18:
                         dabsorptionval = atoi(result+1);
                         cprintf("downward absorption value is %d\n",dabsorptionval);
                         break; 
                      case 19:
                         dpulselenval = atoi(result+1);
                         cprintf("downward pulse length value is %d\n",dpulselenval); 
                         break; 
                      case 20:
                         dataptsval = atoi(result+1);
                         cprintf("2 axis pencil beam data points value is %d\n",dataptsval);
                         break;
                         
                      default:   
                         break;                     
                         
                    } //switch 	               
	             }    //end of if an equal sign there
	          //   else
	          // 	    cprintf(" ");   //else it was a space
	          }  //end of while retval not equal to eof 
	          
	          fclose(fpp); 
	          if(copyifposs)
	            execstr("copy param.bak param.dat");
            }  //end of if openedok = TRUE i.e. if param.dat or param.bak was opened ok
}


/******************************************************************************/

     
void listparams()      // list the parameters for the user
{
   long  actualfreq;

      cprintf("\n1)  start time \t\t\t\t\t\tcurrently %d (minutes after the hour)\n",minafter);
                               
      cprintf("2)  2 axis pencil beam images to average \t\tcurrently %d\n",imgstoavg);
      
      cprintf("3)  seconds between samples \t\t\t\tcurrently %d\n",secbetwsampling); 

      cprintf("4)  minutes for downward sampling \t\t\tcurrently %d\n",minutesdown); 

      printf("5)  azimuth increment in degrees \t\t\tcurrently %lf\n",azinc); 
      
      cprintf("6)  pencil beam range value\t\t\t\tcurrently %d\n",rangeval); //no longer mult by .3
                                                              //which was nec. for Peter D's custom unit
                                                        
      actualfreq = (((long)freqval) * (long)5000) + 175000; 
                                                              
      cprintf("7) frequency value\t\t\t\t\tcurrently %d (%ld Hz)\n",freqval, actualfreq);
                  
      cprintf("8) pencil beam logf value\t\t\t\tcurrently %d\n",logfval);
                   
      cprintf("9) 2 axis pencil beam start gain value\t\tcurrently %d\n",sgainval);

      cprintf("10) 2 axis pencil beam absorption value\t\tcurrently %d\n",absorptionval);
      
      cprintf("11) pencil beam pulse length value\t\t\tcurrently %d\n",pulselenval);
      
      if(threedval==0)
        cprintf("12)  we will not use 3d mode.\n");
      else                    
        cprintf("12)  we will use 3d mode.\n");
        
      if(sendval==0)
        cprintf("13)  data will not be sent serially after aquisition.\n");
      else                    
        cprintf("13)  data will be sent serially after aquisition.\n");
        
      cprintf("14)  downward range value\t\t\t\t\tcurrently %d\n",drangeval);
        
      cprintf("15)  downward freq value\t\t\t\t\tcurrently %d\n", dfreqval);
                
      cprintf("16)  downward logf value\t\t\t\t\tcurrently %d\n",dlogfval);

      cprintf("17)  downward start gain value\t\t\t\t\tcurrently %d\n",dsgainval);
 
      cprintf("18)  downward absorption value\t\t\t\t\tcurrently %d\n",dabsorptionval);

      cprintf("19)  downward pulse length value\t\t\t\t\tcurrently %d\n",dpulselenval); 

      cprintf("20) pencil beam data points value\t\t\tcurrently %d but program hd wired for 250 pts\n",dataptsval);

}     


/******************************************************************************/

         
bool chooseandchange()  //have them choose var # to change and new value
{

      int   choice,newvalue;
      float frange, newfvalue;


	  cprintf("\nType the number of the param you wish to change, or 0 to accept current params  ");
      scanf("%d",&choice);
      if(choice==0)
      {
         return(TRUE);  //indicate that we're done changing
      }
      else if(choice==5)
      {
         cprintf("\nType the new value: "); //elicit the new value
	     scanf("%lf",&newfvalue);
	     printf("\nThe new value is %lf\n",newfvalue);
	  }
      else
      {
         cprintf("\nType the new value: "); //elicit the new value
	     scanf("%d",&newvalue);
	     cprintf("\nThe new value is %d\n",newvalue);
	  }
	     switch(choice)
         {
             case 1: 
               minafter = newvalue;
               cprintf("\nstart time (minutes after the hour) is %d\n",minafter);
               break;
 
             case 2:
               imgstoavg = newvalue;
               cprintf("2 axis pencil beam images to average is %d\n",imgstoavg);
               break; 

             case 3:
               secbetwsampling = newvalue;
               cprintf("seconds between samples are %d\n",secbetwsampling);
               break; 
               
             case 4:
               minutesdown = newvalue;
               cprintf("minutes for downward sampling are %d\n",minutesdown);
               break; 

             case 5:
               azinc = newfvalue;
               printf("azimuth increment in degrees is %lf\n",azinc);
               break; 

             case 6: 
               rangeval = newvalue;
               frange = rangeval;  //881b is no longer divided by .3 (other 881b was)
               printf("pencil beam range value is %d (%2.2f meters)\n",rangeval, frange);
               break; 
               
             case 7:
               freqval = newvalue;
               cprintf("freq value is %d\n",freqval);
               break;
 
            case 8:
               logfval = newvalue;
               cprintf("pencil beam logf value is %d\n",logfval);
               break; 

            case 9:
               sgainval = newvalue;
               cprintf("pencil beam start gain value is %d\n",sgainval);
               break;

            case 10:
               absorptionval2 = newvalue;
               cprintf("pencil beam absorption value is %d\n",absorptionval);
               break;  

            case 11:
               pulselenval = newvalue;
               cprintf("pencil beam pulse length value is %d\n",pulselenval);
               break;
 
            case 12:
               threedval = newvalue;
               if(newvalue==0)
                  cprintf("will not use 3d mode\n");
               else                    
                  cprintf("3d mode will be used.\n");
               break; 
               
            case 13:
               sendval=newvalue;
               if(newvalue==0)
                  cprintf("data will not be sent serially after aquisition.\n");
               else                    
                  cprintf("data will be sent serially after aquisition.\n");
        
            case 14:  
                drangeval = newvalue;
                cprintf("downward range value is %d\n",drangeval);
                break;
                
            case 15:  
                dfreqval = newvalue;
                cprintf("downward freq value is %d\n", dfreqval);
                break;
                
                
			case 16:
			    dlogfval=newvalue;
			    cprintf("downward logf value is %d\n",dlogfval);
			    break;

            case 17:  
                dsgainval = newvalue;
                cprintf("downward start gain value is %d\n",dsgainval);
                break;
 
            case 18: 
                dabsorptionval = newvalue;
                cprintf("downward absorption value is %d\n",dabsorptionval);
                break;

            case 19:
                dpulselenval = newvalue;
                cprintf("downward pulse length value is %d\n",dpulselenval); 
                break;
                
            case 20:
               dataptsval = newvalue;
               cprintf("pencil beam data points value is %d\n",dataptsval);
               break; 
               
            default:
                break; 

         } //switch 
         return(FALSE);     
}

/******************************************************************************/
       
bool checkparams()     // check if all params within spec
{

      bool  invalidvals;

      if(minafter>=60)
      {
        cprintf("\n\nstart time must be from 0 to 59 minutes after the hour\n");
        invalidvals = TRUE;        
      }

      if((rangeval>=1)&&(rangeval<=200))
         new_range = rangeval;
      else
      {
        cprintf("\n\npencil beam range must be between 1 and 200 [3d mode]\n");
        invalidvals = TRUE;  
      } 
       
      if((freqval<0)||(freqval > 200))
      {
        cprintf("\n\nfrequency must be between 0 and 200 using: ((freq_in_khz-675)/5) + 100 \n");
        cprintf("values from 175kHz (0) to 1175 khz (200) in 5 khz increments  [3-d mode]\n");
      }   

      if((sgainval <= 40)&&(sgainval > 0))
           new_gain = sgainval;
      else
      {
           cprintf("\n\npencil beam start gain value must be between 0 and 40db  [3-d mode]\n");
           invalidvals = TRUE;
      }
      if((logfval==0)||(logfval==1)||(logfval==2)||(logfval==3))
           new_logf = logfval;
      else
      {
           cprintf("\n\npencil beam logf value must be 0,1,2,3 (corresponds to 10,20,30,40 db  [3-d mode]\n");
           invalidvals = TRUE;
      }


      if((absorptionval>=0)&&(absorptionval<=255)&&(absorptionval!=253))
          new_absv = absorptionval;
      else
      {
          cprintf("\n\npencil beam absorption must be between 5 and 255 but not 253  [3-d mode]\n");
          invalidvals = TRUE;
      }

      if((pulselenval>=1)&&(pulselenval<=100))
          pulse_length = pulselenval;
      else
      {
          cprintf("\n\npencil beam pulse length must be between 1 and 100 (microsec/10)  [3-d mode]\n");
          invalidvals = TRUE;
      }
      
      if((dataptsval==25)||(dataptsval==50))
         switch(dataptsval)
         {
            case 25:
               new_points = P250; //IMX header
               break;
            case 50:
               new_points = P500; //IGX header
               cprintf("\nprogram hard wired for 250 points for now\n");
               break;
            default:   //removed P2000 as choice 5/14/02
               break;
         } 
            
      else
      {
           cprintf("\n\npencil beam data points value must be 25 or 50\n");
           invalidvals = TRUE;
      }

      if((threedval!=0)&&(threedval!=1))
      {
        cprintf("this value should be a 0 or a 1 (0=no 3d mode, 1=3d mode in acq.\n");
        invalidvals = TRUE;

      }

      if((sendval!=0)&&(sendval!=1))
      {
        cprintf("this value should be a 0 or a 1 (0=do not send, 1=send serially after acq.\n");
        invalidvals = TRUE;

      }
        
      if((drangeval>=1)&&(drangeval<=200))
         dnew_range = drangeval;
      else
      {
        cprintf("\n\npencil beam range must be between 1 and 200 [downward mode]\n");
        invalidvals = TRUE;  
      } 

      if((dfreqval<0)||(dfreqval > 200))
      {
        cprintf("\n\nfrequency must be between 0 and 200 using: ((freq_in_khz-675)/5) + 100\n");
        cprintf("values from 175kHz (0) to 1175 khz (200) in 5 khz increments [downward mode]\n");
      }   

      if((dsgainval <= 40)&&(dsgainval > 0))
           dnew_gain = dsgainval;
      else
      {
           cprintf("\n\npencil beam start gain value [downward mode] must be between 0 and 40db\n");
           invalidvals = TRUE;
      }
      if((dlogfval==0)||(dlogfval==1)||(dlogfval==2)||(dlogfval==3))
           dnew_logf = dlogfval;
      else
      {
           cprintf("\n\npencil beam logf value must be 0,1,2,3 (corresponds to 10,20,30,40 db [downward mode]\n");
           invalidvals = TRUE;
      }


      if((dabsorptionval>=0)&&(dabsorptionval<=255)&&(dabsorptionval!=253))
          dnew_absv = dabsorptionval;
      else
      {
          cprintf("\n\npencil beam absorption must be between 5 and 255 but not 253 [downward mode]\n");
          invalidvals = TRUE;
      }

      if((dpulselenval>=1)&&(dpulselenval<=100))
          dpulse_length = dpulselenval;
      else
      {
          cprintf("\n\npencil beam pulse length must be between 1 and 100 (microsec/10) [downward mode]\n");
          invalidvals = TRUE;
      }

      if(invalidvals==TRUE)
        return(FALSE);
      else
        return(TRUE);
}

/******************************************************************************/


void newparam()  // new var values to newparam.dat, replace param.dat with newparam
{

    FILE *fpn;
    

    if ((fpn = fopen("newparam.dat", "w")) == 0)
	{
	   cprintf("Couldn't open newparam.dat file!\n"); // open newparam
	   return;
	}
	else
	{
      fprintf(fpn,"\nminutes after hour=%d\n",minafter);	    
      fprintf(fpn,"pencil beam images to average=%d\n",imgstoavg);
      fprintf(fpn,"seconds between samples=%d\n",secbetwsampling); 
      fprintf(fpn,"minutes for downward sampling=%d\n",minutesdown);
      fprintf(fpn,"azimuth increment in degrees=%lf\n",azinc);
      fprintf(fpn,"pencil beam range value for 3d mode=%d\n",rangeval);
      fprintf(fpn,"frequency value for 3d mode=%d\n",freqval);
      fprintf(fpn,"pencil beam logf value for 3d mode=%d\n",logfval);
      fprintf(fpn,"pencil beam start gain for 3d mode=%d\n",sgainval);     
      fprintf(fpn,"pencil beam absorption value for 3d mode=%d\n",absorptionval);
      fprintf(fpn,"pencil beam pulse length for 3d mode=%d\n",pulselenval);
      fprintf(fpn,"3d mode choice=%d\n",threedval);
      fprintf(fpn,"serial send choice=%d\n",sendval);
      fprintf(fpn,"pencil beam range value for downward mode=%d\n",drangeval);
      fprintf(fpn,"frequency value for downward mode=%d\n",dfreqval);
      fprintf(fpn,"pencil beam logf value for downward mode=%d\n",dlogfval);
      fprintf(fpn,"pencil beam start gain for downward mode=%d\n",dsgainval);     
      fprintf(fpn,"pencil beam absorption value for downward mode=%d\n",dabsorptionval);
      fprintf(fpn,"pencil beam pulse length for downward mode=%d\n",dpulselenval);
      fprintf(fpn,"pencil beam data points=%d\n",dataptsval);

      fclose(fpn);
      execstr("del param.dat");
      execstr("rename newparam.dat param.dat");     
    }
}


  /******************************************************************************\

**	CheckForAcqTime   -  we'll acquire sonar data when diffsecs equals zero       **

  \******************************************************************************/


void	CheckForAcqTime(long int *diffsecs, time_t lasttimet)

{

    time_t bintime;
    double  doublesecs;
  //  int mpdiv;


    time(&bintime);   /* time in seconds since midnite 1/1/70 GMT */
   //    curtime=localtime(&bintime);
   //    cprintf("in checkforacqtime time is %s ",asctime(curtime));
   //    time(&prevtime);  //get value for checkforacqtime param
   //    curtime=localtime(&lasttimet);
   //    cprintf("and last time is %s\n",asctime(curtime));
    
    doublesecs = difftime(bintime, lasttimet);
    *diffsecs = (long)doublesecs;   
    
}

/******************************************************************************\
**
**	MakeFileName   make a file name from the date and time for downward files
**                 
\******************************************************************************/

void	MakeFileName(char *filename)

{

    struct tm *curtime;

    time_t bintime;

    size_t n,x;

    char   dtchstr[12], daystr[3], minstr[3];  /* date time char string */ 

    char   prefixchars[13]; 


    strcpy(filename,"");/* erase whatever is there */

    time(&bintime);   /* time in seconds since midnite 1/1/70 GMT */

    curtime=localtime(&bintime);     /* convert to local time */

    n=9; /* string length, room for 2 dig mo. 2 dig day plus 2 dig hour out of 24, + 1 extra */

    x = strftime(dtchstr,n,"%m%d%H%M",curtime);

    strncpy(daystr, dtchstr + 2, 2);
    
//    strncpy(minstr,"mg",2);  //get the null at the end
    
    strncpy(minstr, dtchstr + 6, 2);
//    cprintf("\n%s\n",dtchstr);  

        
    minstr[2]='\0';
   
    daystr[2]='\0';
    
    dtchstr[6]='\0';
    
 /*   if(inittime==TRUE)
    {
      thisday = atoi(daystr);  //this is for use later in checkforHDDtime 
      inittime = FALSE;
    }*/

    strcpy(prefixchars,PREFIX);

    strcat(filename,prefixchars);

    strcat(filename,dtchstr);

    strcat(filename,".b");
    
    strcat(filename,minstr);
    
    filename[FILENAMELEN]='\0';

    cprintf("\nThe file name is  %s\n",filename);

}


/******************************************************************************\
**
**	MakeFileName2   make a file name from the date and time for 3D files
**                 
\******************************************************************************/

void	MakeFileName2(char *filename2)

{

    struct tm *curtime;

    time_t bintime;

    size_t n,x;

    char   dtchstr[12], daystr[3], minstr[3];  /* date time char string */ 

    char   prefixchars[13]; 


    strcpy(filename2,"");/* erase whatever is there */

    time(&bintime);   /* time in seconds since midnite 1/1/70 GMT */

    curtime=localtime(&bintime);     /* convert to local time */

    n=9; /* string length, room for 2 dig mo. 2 dig day plus 2 dig hour out of 24, + 1 extra */

    x = strftime(dtchstr,n,"%m%d%H%M",curtime);

    strncpy(daystr, dtchstr + 2, 2);
    
    strncpy(minstr, dtchstr + 6, 2);

        
    minstr[2]='\0';
   
    daystr[2]='\0';
    
    dtchstr[6]='\0';
    
    strcpy(prefixchars,PREFIX3D);

    strcat(filename2,prefixchars);

    strcat(filename2,dtchstr);

    strcat(filename2,".t");    //2 axis 881a pencil beam files
    
    strcat(filename2,minstr);

    filename2[16]='\0';
    
    cprintf("\nThe file name is  %s\n",filename2);

}

/******************************************************************************\
**
**   aqutaimages   acquire binary data from 881a i.e. 2 axis pencil beam sonar
**
\******************************************************************************/

     void   aqutaimages(void)
     {
           
 
           
	        cprintf("152 881a pings\n");   //num_pings is hard wired
		    pingnumb = 0;


            firsttaping();  

            waitfor881init(SHORTINITWAIT);  //time for 881a to go to initial location

  	        while(1)    
            {
              pingnumb++;              

              pingta();
                 
              if((pingnumb==153)||(tatimeoutbreak))  //hard wire  - rcs
               break;               
              

	          chk = get_serial_return_tadata();
	
	    
	          if(chk)
	          {
                store_serial_return_tadata(fp2);  
	          }
	          else
	             cprintf("aqutaimages - did not receive serial return data\n");
	              
	        }  //end of while  1
	       

 
           cprintf("COMPLETED A TWO AXIS PENCIL BEAM SWEEP, READY FOR NEXT IMAGE\n");
          
          fflush(fp2);  //close image file
          fclose(fp2);

     }  
/***************************************************************************/   

 /* set_switches_az */
/* derived from Imagenex's Jeff Patterson's code */

void set_switches_az(void)
{
	ser_sw3[0]  = 0xFE;
	ser_sw3[1]  = 0x44;
	ser_sw3[2]  = 0x1F;		/* Head ID for Azimuth Drive is 0x1F */
	ser_sw3[3]  = 0;
	ser_sw3[4]  = 0;
	ser_sw3[5]  = 0;
	ser_sw3[6]  = 0x43;		/* Slave Mode */
	ser_sw3[7]  = 0;
	ser_sw3[8]  = 0;
	ser_sw3[9]  = 0;
	ser_sw3[10] = 0;
	ser_sw3[11] = (new_azimuth & 0x7F);
	ser_sw3[12] = (new_azimuth & 0x3F80)>>7;
	ser_sw3[13] = 0;
	ser_sw3[14] = 0;
	ser_sw3[15] = 0;
	ser_sw3[16] = 0;
	ser_sw3[17] = 0;
	ser_sw3[18] = 0;
	ser_sw3[19] = 0;
	ser_sw3[20] = 0;
	ser_sw3[21] = 0x06;		/* Up Baud, 0x06 = 115200bps */
	ser_sw3[22] = 0;
	ser_sw3[23] = 0;
	ser_sw3[24] = 0;    		/* Switch Delay, 2ms increments */
	ser_sw3[25] = 0;
	ser_sw3[26] = 0xFD;		/* Termination Character */
	
	return;
}





//************************************************************************************


void SetupTPU(void)
{


    PIOWrite(30,0);  //enabling maxim drivers for rs232 chip
	PIOWrite(29,1);  //enabling maxim drivers on recipe cards

	TUInit(calloc, free);		// give TU manager access to our heap


	tuport = TUOpen(TPUChanFromPin(31), TPUChanFromPin(32), 115200L, TUGetDefaultParams());
	if(!tuport)
		cprintf("\nCannot open TPU Channel\n\n");
	else
		
		cprintf("\nOpened TPU Channel \n");

     
    
}

//************************************************************************************
    