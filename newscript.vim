:let s:linelist = getline(0,'$')
:let s:lines = len(s:linelist)
:let s:i = 0
:while s:i < s:lines
:echo "Line: " . s:i . ": " . get(s:linelist,s:i)
:let s:i += 1
:endwhile 
:finish
