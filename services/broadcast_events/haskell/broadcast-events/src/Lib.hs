{-# LANGUAGE OverloadedStrings #-}
module Lib
    ( start
    ) where


import Prelude hiding (getContents, hGet, interact, putStrLn, scanl, foldl)

import Control.Concurrent (forkIO)
import Control.Concurrent.Chan.Unagi (InChan, getChanContents, newChan, readChan, dupChan, writeChan, writeList2Chan)
import Control.Exception
import Control.Monad (forever, when)
import Data.ByteString.Lazy (ByteString, empty, fromStrict, foldl, foldrChunks, getContents, hGet, interact, pack, putStrLn, scanl, toChunks, toStrict, unpack)
import Data.Either
import Network.Wai.Handler.Warp (run, runSettings, setOnException, setOnOpen, setPort, defaultSettings)
import Network.Wai.Handler.WebSockets as WaiWS
import Network.WebSockets (acceptRequest, receiveDataMessage, sendTextData, PendingConnection, defaultConnectionOptions, DataMessage(..))

import System.IO (hSetBuffering, isEOF, BufferMode( NoBuffering ))


handleWS :: InChan ByteString -> PendingConnection -> IO ()
handleWS bcast pending = do
    localChan <- dupChan bcast
    connection <- acceptRequest pending

    print "Connection?"

    writeChan bcast "o"

    _ <- forkIO $ forever $ do
        message <- readChan localChan
        sendTextData connection message

    -- loop forever
    let loop = do
            Text message <- receiveDataMessage connection
            writeChan bcast message
            loop

    loop


start :: IO ()
-- start = do (forkIO $ forever $ getLine >>= putStrLn) >> return ()
start = do
    putStrLn "Starting"
    (bcast, _) <- newChan
    -- (stdin, _) <- newChan

    -- forkIO $ interact $ (\i o -> writeChan bcast i >> i)

    -- _ <- forkIO $ forever $ getLine >>= putStrLn
    -- interact $ map toUpper
    -- forkIO $ getLine >>= pack >>= writeChan bcast

    -- forkIO $ interact $ broadcast bcast

    -- forkIO $ getContents >>= putStr
    -- forkIO $ getContents >>= writeChan bcast

    -- forkIO $ getChanContents stdin >>= writeList2Chan bcast

    -- forkIO $ interact $ writeChan bcast

    -- _ <- forkIO $ do
    --     contents <- getContents
    --     foldrChunks (\chunk _ -> writeChan bcast chunk) (return "") contents

    -- forkIO $ do
    --     -- putStrLn "getting contents"
    --     hSetBuffering stdin NoBuffering
    --     forever $ do
    --       putStrLn "listening to stdin"
    --       getContents >>= putStr
    --       -- contents <- getContents
    --       -- foldrChunks (\chunk _ -> putStrLn (show chunk)) (return ()) contents
    --       putStrLn "done folding"

    -- _ <- forkIO $ getContents >>= foldrChunks (writeChan bcast) (return "")

    -- _ <- forkIO $ forever $ getContents >>= putStr
    -- putStrLn "ending"
      -- return ()

    -- _ <- forkIO $ forever $ getContents >>= writeChan bcast
    -- _ <- forkIO $ do
    --     contents <- getContents
    --     writeList2Chan bcast (toChunks contents)


    contents <- getContents
    forkIO $ do
      print "writing"
      -- foldrChunks (\a b -> writeChan bcast a >> b) (return contents) contents
      -- runs one line behind
      foldrChunks (\a b -> writeChan bcast (fromStrict a) >> b) (return contents) contents
      print "wrotten"
    -- _ <- forkIO $ do
    --   contents <- getContents
    --   foldrChunks (send bcast) contents contents
    --   -- writeList2Chan bcast contents
    --   putStrLn contents

    run 8080 (WaiWS.websocketsOr defaultConnectionOptions (handleWS bcast) undefined)

    -- where
    --   send :: InChan ByteString -> ByteString -> ByteString
    --   send bcast chunk contents = writeChan bcast (show chunk) >> contents

    -- _ <- forkIO $ forever $ do
    --    contents <- hGet stdin 1000
    --    putStr contents
    --    when (contents == empty) $ putStrLn "empty"
    --    when (contents /= empty) $ writeChan bcast "wut"


    -- where
      -- broadcast bcast contents = foldlChunks send contents
      -- broadcast :: InChan ByteString -> ByteString -> ByteString
      -- broadcast bcast contents = writeChan bcast contents >> contents
      -- broadcast bcast = foldlChunks send
      -- broadcast bcast contents = writeChan bcast (unpack contents) >>
        -- broadcast :: InChan ByteString -> ByteString -> ByteString
        -- broadcast bcast = scanl (send bcast) "server start"
        -- send bcast = writeChan bcast >>= ""

    -- runServer (WaiWS.websocketsOr defaultConnectionOptions (handleWS bcast) undefined)

    -- where
    --     runServer = runSettings
    --         . setOnException (\_ e -> print ("exception" ++ show e))
    --         . setOnOpen (\address -> do
    --                                   putStrLn ("open" ++ show address)
    --                                   return True)
    --         . setPort 8080
    --         $ defaultSettings


    -- runSettings ((
    --     setOnException (\_ e -> print ("exception" ++ show e))
    --     . setPort 8080) defaultSettings)
    --     $ WaiWS.websocketsOr defaultConnectionOptions (handleWS bcast) undefined
