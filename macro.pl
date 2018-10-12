#!/usr/bin/local/perl
use strict;
use warning;

my $inputfile;
if($ARGV[0] != undef){
	open($inputfile, '<', $ARGV[0]);
} else{
	die;
}
my $outputfile;
if($ARGV[1] != undef){
	open($outputfile, '>'. $ARGV[1]);
} else{
	die;
}

for(my $i = 0; 

