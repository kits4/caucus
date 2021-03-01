import React, { useState, createRef, useRef, useContext } from "react";
import { Redirect } from "react-router-dom";
import InputOutputFile from "component/InputOutputFile/InputOutputFile";
import { ReflexContainer, ReflexElement, ReflexSplitter } from "react-reflex";
import "react-reflex/styles.css";
import style from "./Room.module.css";
import { socket } from "service/socket";
import { useSnackbar } from "notistack";
import ChatApp from "component/TextChat";
import VoiceChat from "component/VoiceChat/VoiceChat";
import { useParams } from "react-router-dom";
import MonacoEditor from "component/Editor/MonacoEditor";
import "@convergencelabs/monaco-collab-ext/css/monaco-collab-ext.min.css.map";
import clsx from "clsx";
import { GuestNameContext } from "service/GuestNameContext";
import { UserContext } from "service/UserContext";
import { UserContextTypes, GuestNameContextTypes, UserInfoSS } from "types";
import TabsPanel from "component/QuestionsPane/Tabs";

const Dashboard = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useContext(UserContext) as UserContextTypes;
  const { guestName } = useContext(GuestNameContext) as GuestNameContextTypes;
  const [code, setCode] = useState<string>("");
  const MonacoEditorRef = useRef<any>();
  const TextAreaRef = createRef<HTMLDivElement>();
  const [rows, setRows] = useState(7);
  const [sid, setSid] = useState("");
  const [goBack, setGoBack] = useState(false);
  const [partnerUser, setPartnerUser] = useState<UserInfoSS>();
  const { id } = useParams<Record<string, string>>();

  const prepareData = (): UserInfoSS => {
    return {
      name: user?.name ? user.name : guestName,
      image_link: user?.image_link ? user.image_link : "",
      roomID: id,
    };
  };

  const displayNotification = (data: UserInfoSS, enter: boolean) => {
    const text = enter ? "joined the room" : "left the room";
    const variantStyle = enter ? "success" : "error";
    enqueueSnackbar(`${data.name} ${text}`, {
      variant: variantStyle,
    });
  };

  React.useEffect(() => {
    socket.emit("join-room", prepareData());

    socket.on("store-sid", (id: string) => setSid(id));
    socket.on("new-user-joined", (data: UserInfoSS) => {
      setPartnerUser(data);
      displayNotification(data, true);
    });
    socket.on("room-full", () => {
      setGoBack(true);
    });

    socket.on("connected", (data: Record<string, unknown>) => {
      console.log(`I'm Connected with the backend ${data}`);
    });
    socket.on("user-left", (data: UserInfoSS) => {
      displayNotification(data, false);
    });
  }, []);

  const resetEditorLayout = () => {
    const height = Math.floor(TextAreaRef!.current!.clientHeight);
    const adjustedRows = height > 340 ? height / 27 : height / 35;
    setRows(Math.floor(adjustedRows));
    MonacoEditorRef.current.layout();
  };

  return (
    <>
      <div className={style.root}>
        <ReflexContainer orientation="horizontal">
          {/* <ReflexElement className={style.header} flex={0.08}>
            Caucus
          </ReflexElement> */}
          <ReflexElement style={{ paddingTop: "1rem" }}>
            <ReflexContainer orientation="vertical">
              <ReflexElement>
                <ReflexContainer orientation="horizontal">
                  <ReflexElement className={style["pane-color"]}>
                    <TabsPanel />
                  </ReflexElement>
                </ReflexContainer>
              </ReflexElement>
              {/* End of 1st content */}
              <ReflexSplitter
                className={clsx(style.splitter, style["splitter-verticle"])}
                onStopResize={() => resetEditorLayout()}
              />
              <ReflexElement flex={0.45}>
                <ReflexContainer orientation="horizontal">
                  <ReflexElement style={{ display: "flex" }}>
                    <MonacoEditor code={code} setCode={setCode} MonacoEditorRef={MonacoEditorRef} />
                  </ReflexElement>
                  <ReflexSplitter
                    className={clsx(style.splitter, style["splitter-horizontal"])}
                    onStopResize={() => resetEditorLayout()}
                  />
                  <ReflexElement flex={0.3}>
                    <InputOutputFile
                      rows={rows}
                      TextAreaRef={TextAreaRef}
                      MonacoEditorRef={MonacoEditorRef}
                    />
                  </ReflexElement>
                </ReflexContainer>
              </ReflexElement>
              {/* 3rd content */}
              <ReflexSplitter
                className={clsx(style.splitter, style["splitter-verticle"])}
                onStopResize={() => resetEditorLayout()}
              />
              <ReflexElement>
                <ReflexContainer orientation="horizontal">
                  <ReflexElement className={style["pane-color"]} flex={0.1}>
                    <VoiceChat params={id} user={prepareData()} partnerUser={partnerUser} />
                  </ReflexElement>
                  <ReflexSplitter className={clsx(style.splitter, style["splitter-horizontal"])} />
                  <ReflexElement className={style["chat-app"]}>
                    {/* Chat App Component */}
                    <ChatApp userInfo={prepareData()} socketID={sid} />
                  </ReflexElement>
                </ReflexContainer>
              </ReflexElement>
            </ReflexContainer>
          </ReflexElement>
          <ReflexElement className={style.footer} flex={0.028}>
            Made with <span>&#9829;</span> by Rishabh Malhotra{"  "}•{"  "}
            <a href="https://github.com/Rishabh-malhotraa/codeforces-diary" target="__blank">
              Github
            </a>
          </ReflexElement>
        </ReflexContainer>
      </div>
      {goBack ? <Redirect to={{ pathname: "/home", state: { showNotification: true } }} /> : <></>}
    </>
  );
};

export default Dashboard;
