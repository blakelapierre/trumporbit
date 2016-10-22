-- https://github.com/WeAreWizards/haskell-websockets-tsung-benchmark/blob/master/code/src/Main.hs

{-# LANGUAGE OverloadedStrings #-}
module Lib
    ( start
    ) where


import Prelude hiding (getContents, hGet, interact, scanl, foldl)

import Control.Concurrent (forkIO)
import Control.Concurrent.Chan.Unagi (InChan, getChanContents, newChan, readChan, dupChan, writeChan, writeList2Chan)
import Control.Exception
import Control.Monad (forever, when)
import Data.ByteString.Lazy (ByteString, empty, fromStrict, foldl, foldrChunks, getContents, hGet, interact, pack, scanl, toChunks, toStrict, unpack)
import Data.Either
import Network.Wai.Handler.Warp (run, runSettings, setOnException, setOnOpen, setPort, defaultSettings)
import Network.Wai.Handler.WebSockets as WaiWS
import Network.WebSockets (acceptRequest, receiveDataMessage, sendTextData, PendingConnection, defaultConnectionOptions, DataMessage(..))

import System.IO (hSetBuffering, isEOF, BufferMode( NoBuffering ))


handleWS :: InChan ByteString -> PendingConnection -> IO ()
handleWS bcast pending = do
    localChan <- dupChan bcast
    connection <- acceptRequest pending

    print "New Connection"

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

    contents <- getContents
    forkIO $ do
      -- runs one line behind
      foldrChunks (\a b -> writeChan bcast (fromStrict a) >> b) (return contents) contents
      return ()

    run 8080 (WaiWS.websocketsOr defaultConnectionOptions (handleWS bcast) undefined)