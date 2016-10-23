FROM fpco/haskell-scratch:integer-gmp

ADD ./libffi.so.6 /lib/libffi.so.6
ADD ./broadcast-events-exe /broadcast-events-exe

CMD /broadcast-events-exe < tweets
