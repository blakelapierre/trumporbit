-- https://github.com/WeAreWizards/haskell-websockets-tsung-benchmark/blob/master/code/src/Main.hs

{-# LANGUAGE OverloadedStrings #-}
module Lib
    ( start
    ) where


import Prelude hiding (getContents, hGet, interact, scanl, foldl, concat, putStr)

import Control.Concurrent (forkIO, newMVar, putMVar, readMVar, takeMVar, MVar)
import Control.Concurrent.Chan.Unagi (InChan, getChanContents, newChan, readChan, dupChan, writeChan, writeList2Chan)
import Control.Concurrent.Timer (repeatedTimer)
import Control.Concurrent.Suspend.Lifted (msDelay)
import Control.Exception
import Control.Monad (forever, when)
import Data.ByteString.Lazy (ByteString, empty, concat, fromChunks, fromStrict, foldl, foldrChunks, getContents, putStr, hGet, interact, pack, scanl, toChunks, toStrict, unpack)
import Data.ByteString.Lazy.Builder (intDec, stringUtf8, toLazyByteString)
import Data.Either
import Data.Monoid (Monoid, mappend)
import Network.Wai.Handler.Warp (run, runSettings, setOnException, setOnClose, setOnOpen, setPort, defaultSettings)
import Network.Wai.Handler.WebSockets as WaiWS
import Network.WebSockets (acceptRequest, receiveData, receiveDataMessage, fromLazyByteString, send, sendTextData, PendingConnection, defaultConnectionOptions, DataMessage(..))

import System.IO (hSetBuffering, isEOF, stdin, BufferMode( NoBuffering ))

(<>) :: Monoid a => a -> a -> a
(<>) = mappend


handleWS :: InChan ByteString -> MVar Int -> PendingConnection -> IO ()
handleWS bcast connectionCount pending = do
    localChan <- dupChan bcast
    connection <- acceptRequest pending

    count <- readMVar connectionCount

    sendTextData connection (toLazyByteString $ stringUtf8 "o," <> (intDec count))

    contents <- getChanContents localChan

    _ <- forkIO $ do
      foldr (\a b -> sendTextData connection a >> b) (return ()) contents

    -- broadcast ?
    -- message <- receiveData connection
    -- _ <- forkIO $ do
    --   -- writeChan bcast message
    --   putStr message

    -- return ()
    -- _ <- forkIO $ forever $ do
    --     message <- readChan localChan
    --     sendTextData connection message

    -- loop forever
    let loop = do
          Text message <- receiveDataMessage connection
          -- writeChan bcast message
          loop

    loop



start :: IO ()
-- start = do (forkIO $ forever $ getLine >>= putStrLn) >> return ()
start = do
    putStrLn "Starting"
    (bcast, _) <- newChan

    hSetBuffering stdin NoBuffering

    contents <- getContents
    forkIO $ do
      foldrChunks (\a b -> when (fromStrict a /= empty) (writeChan bcast (fromStrict a)) >> b) (return contents) contents
      return ()

    connectionCount <- newMVar 0

    repeatedTimer (printStats connectionCount) (msDelay 1000)
    -- run 8080 (WaiWS.websocketsOr defaultConnectionOptions (handleWS bcast connectionCount) undefined)

    runSettings ((
        setOnOpen (openHandler connectionCount bcast)
      . setOnClose (closeHandler connectionCount bcast)
      . setOnException (\_ e -> print ("Exception" ++ show e))
      . setPort 8080) defaultSettings)
      $ WaiWS.websocketsOr defaultConnectionOptions (handleWS bcast connectionCount) undefined

      where
        closeHandler connectionCount bcast addr = do
          count <- takeMVar connectionCount
          putMVar connectionCount (count - 1)

          -- writeChan bcast (toLazyByteString $ stringUtf8 "o-," <> (intDec (count - 1)))

        openHandler connectionCount bcast addr = do
          count <- takeMVar connectionCount
          putMVar connectionCount (count + 1)

          -- writeChan bcast (toLazyByteString $ stringUtf8 "o," <> (intDec (count + 1)))

          return True

        printStats connectionCount = do
          count <- readMVar connectionCount
          print count